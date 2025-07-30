# Weather Dashboard 🌤️

A comprehensive weather application providing real-time weather data, forecasts, and city comparisons with enterprise-grade load balancing for high availability. Built with Node.js, Express, and vanilla JavaScript.

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
   git clone <your-repo-url>
   cd weather-dashboard
   cp .env.example .env
   # Edit .env and add your OPENWEATHER_API_KEY
   ```

2. **Start the application stack**
   ```bash
   docker-compose up -d
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

### Enterprise Features
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

## 🧪 Testing & Validation

### Automated Health Checks
The application includes comprehensive health monitoring:
```bash
# Check all service status
docker-compose ps

# Verify application health
curl http://localhost:8080/health

# Test load balancer health
curl http://localhost:8080/lb-health
```

### Load Balancing Verification
Test traffic distribution across servers:
```bash
# Verify round-robin distribution
for i in {1..6}; do
  curl -s http://localhost:8080/api/weather/current/london | grep -o '"server_id":"[^"]*"'
  sleep 1
done
# Should show alternating web01/web02 responses
```

### High Availability Testing
Simulate server failures to test resilience:
```bash
# Stop one server instance
docker-compose stop web01

# Application should remain available via web02
curl http://localhost:8080/health
# Should return 200 OK

# Restart failed server
docker-compose start web01

# Verify full restoration
docker-compose ps
```

### API Endpoint Testing
```bash
# Test current weather endpoint
curl "http://localhost:8080/api/weather/current/london"

# Test forecast endpoint
curl "http://localhost:8080/api/weather/forecast/paris"

# Test city search
curl "http://localhost:8080/api/cities/search/new"

# Test weather comparison
curl -X POST http://localhost:8080/api/weather/compare \
  -H "Content-Type: application/json" \
  -d '{"cities":["london","paris","tokyo"]}'
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
SERVER_ID=web01            # Server identifier for load balancing
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
git clone <repository-url>
cd weather-dashboard
cp .env.example .env
# Edit .env with your API key

# Start development stack
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Deployment (Manual)

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

#### Option 2: Multi-Server Load Balanced Deployment
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

#### Option 3: Container Registry Deployment
```bash
# Build and push to registry
docker build -t your-registry/weather-dashboard:v1.0 .
docker push your-registry/weather-dashboard:v1.0

# Deploy on target servers
docker pull your-registry/weather-dashboard:v1.0
docker run -d \
  --name weather-app \
  -p 8080:8080 \
  -e OPENWEATHER_API_KEY=your_key \
  your-registry/weather-dashboard:v1.0
```

#### Option 4: Pre-built Docker Image
For quick deployment, use the pre-built image:
```bash
# Pull and run the pre-built image
docker run -d \
  --name weather-app \
  -p 8080:8080 \
  -e OPENWEATHER_API_KEY=your_key \
  docker.io/uwenayoallain/weather-dashboard:latest

# Or with docker-compose override
# Create docker-compose.override.yml:
cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  web01:
    image: docker.io/uwenayoallain/weather-dashboard:latest
  web02:
    image: docker.io/uwenayoallain/weather-dashboard:latest
EOF

# Start with pre-built images
docker-compose up -d
```

## 🛠️ Troubleshooting Guide

### Common Issues and Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Services won't start** | `docker-compose up` fails | `docker-compose down && docker-compose up -d --build` |
| **502 Bad Gateway** | Load balancer returns 502 | Check: `docker-compose logs web01 web02` |
| **API Key Errors** | Weather data not loading | Verify `OPENWEATHER_API_KEY` in `.env` file |
| **Port Conflicts** | Cannot bind to port 8080 | Change port in `docker-compose.yml` or stop conflicting services |
| **Load Balancer Issues** | Traffic not distributing | Verify: `curl http://localhost:8080/health` returns 200 |
| **Container Build Fails** | Docker build errors | Ensure all dependencies in `package.json` are valid |

### Diagnostic Commands

```bash
# Check overall system status
docker-compose ps

# View application logs
docker-compose logs -f

# Check specific service logs
docker-compose logs web01
docker-compose logs loadbalancer

# Test API endpoints manually
curl -v http://localhost:8080/health
curl -v http://localhost:8080/api/weather/current/london

# Verify load balancing
for i in {1..4}; do 
  curl -s http://localhost:8080/health | grep -o '"version":"[^"]*"'
done

# Check network connectivity
docker network ls
docker network inspect weather-network
```

### Performance Monitoring

```bash
# Monitor container resource usage
docker stats

# Check container health status
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# View health check history
docker inspect weather-web01 | grep -A5 Health
```

## 📋 Management Commands

### Development Operations
```bash
# Start development environment
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart web01

# Rebuild and restart
docker-compose up -d --build

# View real-time logs
docker-compose logs -f --tail=50

# Clean up unused resources
docker system prune -f
```

### Production Operations
```bash
# Graceful shutdown
docker-compose down --timeout 30

# Rolling restart (zero downtime)
docker-compose restart web01
sleep 10
docker-compose restart web02

# Update application (with new image)
docker-compose pull
docker-compose up -d --force-recreate

# Backup configuration
tar -czf weather-dashboard-backup.tar.gz .env docker-compose.yml haproxy.cfg
```

## 🏆 Performance Metrics

### Expected Performance Benchmarks
- **Response Time**: < 200ms for cached responses
- **Throughput**: 100+ concurrent users supported
- **Availability**: 99.9% uptime with load balancing
- **API Rate Limit**: 100 requests/minute per IP
- **Failover Time**: < 5 seconds for server switching

### Load Testing Example
```bash
# Simple load test using curl
for i in {1..100}; do
  curl -s -o /dev/null -w "%{http_code} %{time_total}\n" \
    http://localhost:8080/api/weather/current/london &
done
wait
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

**License**: MIT License - See LICENSE file for details

**Educational Use**: This project demonstrates:
- RESTful API design and implementation
- Load balancing and high availability architecture
- Containerized application deployment
- Frontend-backend integration
- Error handling and user experience design

**Commercial Use**: External API keys required for production deployment. Ensure compliance with OpenWeatherMap terms of service for commercial applications.