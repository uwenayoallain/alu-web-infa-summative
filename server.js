const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://openweathermap.org"],
            connectSrc: ["'self'"]
        }
    }
}));

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
});

app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (rejRes) {
        res.status(429).json({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.'
        });
    }
});

// OpenWeatherMap API configuration
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_BASE_URL = 'https://api.openweathermap.org/geo/1.0';

// Validation middleware
const validateApiKey = (req, res, next) => {
    if (!WEATHER_API_KEY) {
        return res.status(500).json({
            error: 'Configuration Error',
            message: 'Weather API key not configured'
        });
    }
    next();
};

const validateCity = (req, res, next) => {
    const { city } = req.params;
    if (!city || city.trim().length === 0) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'City name is required'
        });
    }
    next();
};

// Helper function to handle API errors
const handleApiError = (error, res, context) => {
    console.error(`Error in ${context}:`, error.message);

    if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'API request failed';

        if (status === 404) {
            return res.status(404).json({
                error: 'City Not Found',
                message: 'The specified city could not be found'
            });
        } else if (status === 401) {
            return res.status(500).json({
                error: 'API Configuration Error',
                message: 'Invalid API key configuration'
            });
        } else {
            return res.status(status).json({
                error: 'Weather Service Error',
                message: message
            });
        }
    }

    res.status(500).json({
        error: 'Service Unavailable',
        message: 'Weather service is temporarily unavailable'
    });
};

// Get coordinates for a city
async function getCityCoordinates(cityName) {
    const response = await axios.get(`${GEO_BASE_URL}/direct`, {
        params: {
            q: cityName,
            limit: 1,
            appid: WEATHER_API_KEY
        }
    });

    if (response.data.length === 0) {
        throw new Error('City not found');
    }

    return {
        lat: response.data[0].lat,
        lon: response.data[0].lon,
        name: response.data[0].name,
        country: response.data[0].country,
        state: response.data[0].state
    };
}

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get current weather for a city
app.get('/api/weather/current/:city', validateApiKey, validateCity, async (req, res) => {
    try {
        const { city } = req.params;
        const coords = await getCityCoordinates(city);

        const weatherResponse = await axios.get(`${WEATHER_BASE_URL}/weather`, {
            params: {
                lat: coords.lat,
                lon: coords.lon,
                appid: WEATHER_API_KEY,
                units: 'metric'
            }
        });

        const data = weatherResponse.data;

        res.json({
            location: {
                name: coords.name,
                country: coords.country,
                state: coords.state,
                coordinates: [coords.lat, coords.lon]
            },
            current: {
                temperature: Math.round(data.main.temp),
                feelsLike: Math.round(data.main.feels_like),
                humidity: data.main.humidity,
                pressure: data.main.pressure,
                visibility: Math.round((data.visibility || 10000) / 1000),
                uvIndex: null, // Would need separate API call
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                windSpeed: Math.round(data.wind?.speed * 3.6 || 0), // Convert m/s to km/h
                windDirection: data.wind?.deg || 0,
                cloudiness: data.clouds?.all || 0
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleApiError(error, res, 'current weather');
    }
});

// Get 5-day forecast for a city
app.get('/api/weather/forecast/:city', validateApiKey, validateCity, async (req, res) => {
    try {
        const { city } = req.params;
        const coords = await getCityCoordinates(city);

        const forecastResponse = await axios.get(`${WEATHER_BASE_URL}/forecast`, {
            params: {
                lat: coords.lat,
                lon: coords.lon,
                appid: WEATHER_API_KEY,
                units: 'metric'
            }
        });

        const forecastData = forecastResponse.data.list;

        // Group by day and get daily summaries
        const dailyForecasts = [];
        const processedDays = new Set();

        forecastData.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();

            if (!processedDays.has(dayKey) && dailyForecasts.length < 5) {
                dailyForecasts.push({
                    date: date.toISOString().split('T')[0],
                    dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
                    temperature: {
                        min: Math.round(item.main.temp_min),
                        max: Math.round(item.main.temp_max)
                    },
                    description: item.weather[0].description,
                    icon: item.weather[0].icon,
                    humidity: item.main.humidity,
                    windSpeed: Math.round(item.wind?.speed * 3.6 || 0),
                    precipitation: Math.round((item.rain?.['3h'] || 0) * 100) / 100
                });
                processedDays.add(dayKey);
            }
        });

        res.json({
            location: {
                name: coords.name,
                country: coords.country,
                state: coords.state
            },
            forecast: dailyForecasts,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleApiError(error, res, 'forecast');
    }
});

// Compare weather between multiple cities
app.post('/api/weather/compare', validateApiKey, async (req, res) => {
    try {
        const { cities } = req.body;

        if (!Array.isArray(cities) || cities.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Cities array is required'
            });
        }

        if (cities.length > 5) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Maximum 5 cities allowed for comparison'
            });
        }

        const weatherPromises = cities.map(async (city) => {
            try {
                const coords = await getCityCoordinates(city);
                const weatherResponse = await axios.get(`${WEATHER_BASE_URL}/weather`, {
                    params: {
                        lat: coords.lat,
                        lon: coords.lon,
                        appid: WEATHER_API_KEY,
                        units: 'metric'
                    }
                });

                const data = weatherResponse.data;
                return {
                    city: coords.name,
                    country: coords.country,
                    temperature: Math.round(data.main.temp),
                    description: data.weather[0].description,
                    icon: data.weather[0].icon,
                    humidity: data.main.humidity,
                    windSpeed: Math.round(data.wind?.speed * 3.6 || 0)
                };
            } catch (error) {
                return {
                    city: city,
                    error: 'Failed to fetch weather data'
                };
            }
        });

        const results = await Promise.all(weatherPromises);

        res.json({
            comparison: results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleApiError(error, res, 'weather comparison');
    }
});

// Search cities by name
app.get('/api/cities/search/:query', validateApiKey, async (req, res) => {
    try {
        const { query } = req.params;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Search query must be at least 2 characters long'
            });
        }

        const response = await axios.get(`${GEO_BASE_URL}/direct`, {
            params: {
                q: query,
                limit: 10,
                appid: WEATHER_API_KEY
            }
        });

        const cities = response.data.map(city => ({
            name: city.name,
            country: city.country,
            state: city.state,
            coordinates: [city.lat, city.lon]
        }));

        res.json({
            cities: cities,
            query: query,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleApiError(error, res, 'city search');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Weather Dashboard Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);

    if (!WEATHER_API_KEY) {
        console.warn('⚠️  WARNING: OPENWEATHER_API_KEY environment variable not found!');
        console.log('Please set your OpenWeatherMap API key in the .env file');
    }
});