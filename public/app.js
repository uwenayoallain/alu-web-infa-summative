// Weather Dashboard Application
class WeatherApp {
    constructor() {
        this.currentCity = '';
        this.favorites = this.loadFavorites();
        this.searchTimeout = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDateTime();
        this.renderFavorites();

        // Load default city (user's location or a default)
        this.loadDefaultCity();

        // Update time every minute
        setInterval(() => this.updateDateTime(), 60000);
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('citySearch');
        const searchBtn = document.getElementById('searchBtn');
        const searchResults = document.getElementById('searchResults');

        searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchCity(e.target.value.trim());
            }
        });

        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                this.searchCity(query);
            }
        });

        // Click outside to close search results
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.style.display = 'none';
            }
        });

        // Retry button
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            if (this.currentCity) {
                this.loadWeatherData(this.currentCity);
            }
        });

        // Clear favorites
        document.getElementById('clearFavorites').addEventListener('click', () => {
            this.clearFavorites();
        });

        // Comparison functionality
        document.getElementById('compareBtn').addEventListener('click', () => {
            this.toggleComparison();
        });

        document.getElementById('startComparison').addEventListener('click', () => {
            this.startComparison();
        });
    }

    async handleSearchInput(e) {
        const query = e.target.value.trim();

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        if (query.length < 2) {
            document.getElementById('searchResults').style.display = 'none';
            return;
        }

        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.searchCities(query);
        }, 300);
    }

    async searchCities(query) {
        try {
            const response = await fetch(`/api/cities/search/${encodeURIComponent(query)}`);
            const data = await response.json();

            if (response.ok) {
                this.displaySearchResults(data.cities);
            } else {
                console.error('Search error:', data.message);
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    }

    displaySearchResults(cities) {
        const resultsContainer = document.getElementById('searchResults');

        if (cities.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result"><div class="result-info"><p>No cities found</p></div></div>';
            resultsContainer.style.display = 'block';
            return;
        }

        resultsContainer.innerHTML = cities.map(city => {
            const cityKey = `${city.name},${city.country}`;
            const isFavorited = this.favorites.some(fav => fav.key === cityKey);

            return `
                <div class="search-result" onclick="weatherApp.selectCity('${city.name}', '${city.country}')">
                    <div class="result-info">
                        <h4>${city.name}</h4>
                        <p>${city.state ? city.state + ', ' : ''}${city.country}</p>
                    </div>
                    <button class="add-favorite ${isFavorited ? 'favorited' : ''}" 
                            onclick="event.stopPropagation(); weatherApp.toggleFavorite('${city.name}', '${city.country}', this)">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
            `;
        }).join('');

        resultsContainer.style.display = 'block';
    }

    async selectCity(cityName, country) {
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('citySearch').value = '';

        const cityKey = country ? `${cityName}, ${country}` : cityName;
        this.currentCity = cityKey;

        await this.loadWeatherData(cityKey);
    }

    async searchCity(query) {
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('citySearch').value = '';

        this.currentCity = query;
        await this.loadWeatherData(query);
    }

    async loadWeatherData(city) {
        this.showLoading();
        this.hideError();

        try {
            // Load current weather and forecast in parallel
            const [currentResponse, forecastResponse] = await Promise.all([
                fetch(`/api/weather/current/${encodeURIComponent(city)}`),
                fetch(`/api/weather/forecast/${encodeURIComponent(city)}`)
            ]);

            const currentData = await currentResponse.json();
            const forecastData = await forecastResponse.json();

            if (currentResponse.ok && forecastResponse.ok) {
                this.displayCurrentWeather(currentData);
                this.displayForecast(forecastData);
                this.hideLoading();
                this.showWeatherSections();
            } else {
                throw new Error(currentData.message || forecastData.message || 'Failed to load weather data');
            }
        } catch (error) {
            console.error('Weather data error:', error);
            this.hideLoading();
            this.showError(error.message || 'Failed to load weather data. Please try again.');
        }
    }

    displayCurrentWeather(data) {
        const { location, current } = data;

        // Update location info
        document.getElementById('currentCity').textContent =
            `${location.name}${location.state ? ', ' + location.state : ''}, ${location.country}`;

        // Update main weather info
        document.getElementById('currentTemp').textContent = current.temperature;
        document.getElementById('currentDescription').textContent = current.description;
        document.getElementById('feelsLike').textContent = current.feelsLike;

        // Update weather icon
        const iconElement = document.getElementById('currentIcon');
        iconElement.src = `https://openweathermap.org/img/wn/${current.icon}@2x.png`;
        iconElement.alt = current.description;

        // Update weather stats
        document.getElementById('visibility').textContent = `${current.visibility} km`;
        document.getElementById('humidity').textContent = `${current.humidity}%`;
        document.getElementById('windSpeed').textContent = `${current.windSpeed} km/h`;
        document.getElementById('pressure').textContent = `${current.pressure} hPa`;
    }

    displayForecast(data) {
        const forecastContainer = document.getElementById('forecast');
        const { forecast } = data;

        forecastContainer.innerHTML = forecast.map(day => `
            <div class="forecast-card">
                <div class="day">${day.dayName}</div>
                <div class="date">${this.formatDate(day.date)}</div>
                <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}">
                <div class="temp">${day.temperature.min}° / ${day.temperature.max}°</div>
                <div class="description">${day.description}</div>
                <div class="forecast-details">
                    <span><i class="fas fa-tint"></i> ${day.humidity}%</span>
                    <span><i class="fas fa-wind"></i> ${day.windSpeed} km/h</span>
                </div>
            </div>
        `).join('');
    }

    async toggleFavorite(cityName, country, buttonElement) {
        const cityKey = `${cityName},${country}`;
        const cityDisplay = country ? `${cityName}, ${country}` : cityName;

        const existingIndex = this.favorites.findIndex(fav => fav.key === cityKey);

        if (existingIndex >= 0) {
            // Remove from favorites
            this.favorites.splice(existingIndex, 1);
            buttonElement.classList.remove('favorited');
        } else {
            // Add to favorites
            try {
                const response = await fetch(`/api/weather/current/${encodeURIComponent(cityDisplay)}`);
                const data = await response.json();

                if (response.ok) {
                    this.favorites.push({
                        key: cityKey,
                        name: cityName,
                        country: country,
                        display: cityDisplay,
                        temperature: data.current.temperature,
                        description: data.current.description,
                        icon: data.current.icon
                    });
                    buttonElement.classList.add('favorited');
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Failed to add favorite:', error);
                return;
            }
        }

        this.saveFavorites();
        this.renderFavorites();
    }

    renderFavorites() {
        const container = document.getElementById('favoriteCities');

        if (this.favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map-marker-alt"></i>
                    <p>No favorite cities yet. Search for a city and click the star to add it!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.favorites.map(city => `
            <div class="favorite-card" onclick="weatherApp.selectCity('${city.display.replace(/'/g, "\\'")}')">
                <button class="remove-favorite" onclick="event.stopPropagation(); weatherApp.removeFavorite('${city.key}')">
                    <i class="fas fa-times"></i>
                </button>
                <div class="city-name">${city.display}</div>
                <div class="temp-display">${city.temperature}°C</div>
                <div class="description">${city.description}</div>
                <img src="https://openweathermap.org/img/wn/${city.icon}.png" alt="${city.description}" style="width: 40px; height: 40px;">
            </div>
        `).join('');
    }

    removeFavorite(cityKey) {
        this.favorites = this.favorites.filter(fav => fav.key !== cityKey);
        this.saveFavorites();
        this.renderFavorites();
    }

    clearFavorites() {
        if (confirm('Are you sure you want to clear all favorite cities?')) {
            this.favorites = [];
            this.saveFavorites();
            this.renderFavorites();
        }
    }

    toggleComparison() {
        const container = document.getElementById('comparisonContainer');
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            document.getElementById('compareBtn').textContent = 'Hide Comparison';
        } else {
            container.classList.add('hidden');
            document.getElementById('compareBtn').textContent = 'Compare Cities';
        }
    }

    async startComparison() {
        const input = document.getElementById('comparisonInput');
        const cities = input.value.split(',').map(city => city.trim()).filter(city => city.length > 0);

        if (cities.length < 2) {
            alert('Please enter at least 2 cities separated by commas');
            return;
        }

        if (cities.length > 5) {
            alert('Maximum 5 cities allowed for comparison');
            return;
        }

        try {
            const response = await fetch('/api/weather/compare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cities })
            });

            const data = await response.json();

            if (response.ok) {
                this.displayComparison(data.comparison);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Comparison error:', error);
            alert('Failed to compare cities. Please try again.');
        }
    }

    displayComparison(comparisons) {
        const container = document.getElementById('comparisonResults');

        // Find best and worst temperatures
        const validComparisons = comparisons.filter(c => !c.error);
        if (validComparisons.length === 0) {
            container.innerHTML = '<p>No valid city data found for comparison.</p>';
            return;
        }

        const temperatures = validComparisons.map(c => c.temperature);
        const maxTemp = Math.max(...temperatures);
        const minTemp = Math.min(...temperatures);

        container.innerHTML = comparisons.map(city => {
            if (city.error) {
                return `
                    <div class="comparison-card">
                        <div class="city">${city.city}</div>
                        <div class="error">Error: ${city.error}</div>
                    </div>
                `;
            }

            let cardClass = '';
            if (city.temperature === maxTemp) cardClass = 'best-temp';
            if (city.temperature === minTemp) cardClass = 'worst-temp';

            return `
                <div class="comparison-card ${cardClass}">
                    <div class="city">${city.city}${city.country ? ', ' + city.country : ''}</div>
                    <div class="temp">${city.temperature}°C</div>
                    <div class="desc">${city.description}</div>
                    <div class="details">
                        <div><i class="fas fa-tint"></i> ${city.humidity}%</div>
                        <div><i class="fas fa-wind"></i> ${city.windSpeed} km/h</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Utility methods
    updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    loadFavorites() {
        try {
            const stored = localStorage.getItem('weatherFavorites');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load favorites:', error);
            return [];
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.error('Failed to save favorites:', error);
        }
    }

    async loadDefaultCity() {
        // Try to get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        // You could implement a reverse geocoding endpoint here
                        // For now, load a default city
                        await this.loadWeatherData('Toronto');
                    } catch (error) {
                        await this.loadWeatherData('Toronto');
                    }
                },
                () => {
                    // Geolocation failed, load default city
                    this.loadWeatherData('Toronto');
                }
            );
        } else {
            // Geolocation not supported, load default city
            await this.loadWeatherData('Toronto');
        }
    }

    // State management methods
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        this.hideWeatherSections();
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('error').classList.remove('hidden');
        document.getElementById('errorText').textContent = message;
        this.hideWeatherSections();
    }

    hideError() {
        document.getElementById('error').classList.add('hidden');
    }

    showWeatherSections() {
        document.getElementById('currentWeather').classList.remove('hidden');
        document.getElementById('forecastSection').classList.remove('hidden');
    }

    hideWeatherSections() {
        document.getElementById('currentWeather').classList.add('hidden');
        document.getElementById('forecastSection').classList.add('hidden');
    }
}

// Initialize the application
const weatherApp = new WeatherApp();