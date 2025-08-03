# Weather Dashboard 🌤️
A weather application providing real-time weather data, forecasts, and city comparisons with load balancing for high availability. Built with Node.js, Express, and vanilla JavaScript.

## Docker Image
[Weather-dashboard](https://hub.docker.com/r/uwenayoallain/weather-dashboard)
## 🎯 Purpose & Value

This weather dashboard serves practical needs for:
- **Daily Weather Planning**: Real-time conditions and 5-day forecasts
- **Travel Decision Making**: Compare weather across multiple destinations
- **Location Management**: Save and track favorite cities
- **Enterprise Deployment**: Production-ready with load balancing and failover

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- OpenWeatherMap API key ([Get free key here](https://openweathermap.org/api))

### Local Development Setup

1. **Clone and configure environment**
   ```bash
   git clone git@github.com:uwenayoallain/alu-web-infa-summative.git weather-dashboard
   cd weather-dashboard
   touch .env
   # Edit .env and add your OPENWEATHER_API_KEY
   ```

2. **Start the application stack**
   ```bash
   docker compose up -d
   ```

3. **Verify deployment**
   - **Main Application**: http://localhost:8080
   - **Health Check**: http://localhost:8080/health
   - **Load Balancer Status**: http://localhost:8080/lb-health

## ✨ Core Features

### Weather Data & Forecasting
- **Real-time Current Weather**: Temperature, humidity, wind, pressure, visibility
- **5-Day Extended Forecast**: Daily predictions with precipitation and wind data
- **Automatic Location Detection**: Uses browser geolocation for local weather
- **Global City Search**: Comprehensive city database with autocomplete suggestions

### User Interaction & Data Management
- **Favorites Management**: Save, organize, and quickly access preferred locations
- **Multi-City Comparison**: Compare weather conditions across up to 5 cities simultaneously
- **Interactive Search**: Debounced search with real-time city suggestions
- **Data Sorting & Filtering**: Organize information by various criteria
- **Persistent Storage**: Local storage for user preferences and favorites

### Important Features
- **High Availability**: Load balancing across multiple server instances
- **Health Monitoring**: Comprehensive health checks for all services
- **Rate Limiting**: API protection with 100 requests per minute per IP
- **Error Resilience**: Graceful failure handling and user feedback

## 🏗️ System Architecture

### Load-Balanced Infrastructure
- **HAProxy Load Balancer**: Round-robin traffic distribution on port 8080
- **Web Server 01**: Node.js application instance (internal port 8084)
- **Web Server 02**: Node.js application instance (internal port 8085)
- **Docker Network**: Isolated `weather-network` for secure communication

### Technology Stack
- **Backend**: Node.js with Express.js framework
- **Frontend**: Vanilla JavaScript ES6+ with responsive CSS
- **Load Balancer**: HAProxy 2.8 Alpine with health monitoring
- **Containerization**: Docker with multi-service orchestration
- **Security**: Helmet.js, CORS, CSP headers, rate limiting
- **External APIs**: OpenWeatherMap Current Weather & Forecast APIs

### Load Balancing Verification
Test traffic distribution across servers:
```bash
# Verify round-robin distribution
for i in {1..6}; do
  curl -s http://localhost:8080/api/weather/current/london | grep -o '"server_id":"[^"]*"'
  sleep 1
done
# Should show alternating web01/web02 responses in docker logs -f weather-loadbalancer
```


## 📡 API Reference

### Health & Monitoring Endpoints
| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/health` | GET | Application health status | `{"status":"healthy","timestamp":"...","version":"1.0.0"}` |
| `/lb-health` | GET | Load balancer health check | `OK` (200 status) |

### Weather Data Endpoints
| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|-----------|
| `/api/weather/current/:city` | GET | Current weather for specified city | `city` - City name (required) |
| `/api/weather/forecast/:city` | GET | 5-day weather forecast | `city` - City name (required) |
| `/api/weather/compare` | POST | Compare weather across multiple cities | `{"cities": ["city1", "city2", ...]}` (max 5) |

### Location & Search Endpoints
| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|-----------|
| `/api/cities/search/:query` | GET | Search cities with autocomplete | `query` - Search term (min 2 chars) |
| `/api/location/reverse/:lat/:lon` | GET | Reverse geocoding (coordinates to city) | `lat`, `lon` - Coordinates |

### Rate Limiting
- **Limit**: 100 requests per minute per IP address
- **Response**: 429 status with retry-after header when exceeded

## ⚙️ Configuration

### Environment Variables
Create `.env` file in project root:
```bash
# Required
OPENWEATHER_API_KEY=your_openweathermap_api_key_here

# Optional
PORT=8080                    # Application port (default: 8080)
NODE_ENV=production         # Environment mode
```

### Security Configuration
The application implements multiple security layers:
- **CSP Headers**: Content Security Policy for XSS protection
- **CORS**: Cross-Origin Resource Sharing configuration
- **Rate Limiting**: IP-based request throttling
- **Input Validation**: Parameter sanitization and validation
- **Error Handling**: Secure error responses without sensitive information

## 🚀 Deployment Options

### Local Development Environment
```bash
# Clone and setup
git clone git@github.com:uwenayoallain/alu-web-infa-summative.git weather-dashboard
cd weather-dashboard
touch .env
# Edit .env with your API key

# Start development stack
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Deployment

#### Option 1: Single Server Deployment
```bash
# Build production image
docker build -t weather-dashboard:prod .

# Run with production settings
docker run -d \
  --name weather-app \
  -p 8080:8080 \
  -e OPENWEATHER_API_KEY=your_key \
  -e NODE_ENV=production \
  weather-dashboard:prod
```

#### Option 2: Multi-Server Load Balanced Deployment (Recommended)
```bash
# On each web server (web-01, web-02)
docker build -t weather-dashboard:prod .
docker run -d \
  --name weather-app \
  -p 8084:8080 \
  -e OPENWEATHER_API_KEY=your_key \
  -e NODE_ENV=production \
  -e SERVER_ID=web01 \
  weather-dashboard:prod

# On load balancer server (lb-01)
# Configure HAProxy with provided haproxy.cfg
# Point backend servers to web-01:8084 and web-02:8084
```

## 🙏 Credits & Attribution

### External APIs and Services
- **[OpenWeatherMap API](https://openweathermap.org/)** - Weather data provider
  - Current weather conditions
  - 5-day forecast data  
  - Geocoding services
  - City search database

### Third-Party Resources
- **[Font Awesome](https://fontawesome.com/)** - Icon library
- **[HAProxy](https://www.haproxy.org/)** - Load balancing solution
- **[Docker](https://www.docker.com/)** - Containerization platform

### Technology Stack Credits
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[Express.js](https://expressjs.com/)** - Web application framework
- **[Docker Compose](https://docs.docker.com/compose/)** - Multi-container orchestration

## 📄 License & Usage

This project is created for educational purposes as part of a web infrastructure assignment.

**License**: MIT License

**Educational Use**: This project demonstrates:
- RESTful API design and implementation
- Load balancing and high availability architecture
- Containerized application deployment
- Frontend-backend integration
- Error handling and user experience design

External API keys required for production deployment. Ensure compliance with OpenWeatherMap terms of service for commercial applications.
