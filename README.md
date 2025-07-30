# Weather Dashboard 🌤️

A comprehensive weather application that provides real-time weather data, forecasts, and city comparisons using the OpenWeatherMap API. Built with Node.js, Express, and vanilla JavaScript.

## Features

### Core Functionality

- **Current Weather**: Real-time weather conditions for any city worldwide
- **5-Day Forecast**: Extended weather predictions with detailed information
- **City Search**: Intelligent city search with auto-suggestions
- **Favorite Cities**: Save and manage your favorite locations
- **City Comparison**: Compare weather conditions across multiple cities (up to 5)
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### User Experience

- **Interactive Interface**: Click-friendly cards and smooth animations
- **Error Handling**: Comprehensive error messages and retry functionality
- **Loading States**: Visual feedback during data fetching
- **Local Storage**: Persistent favorite cities across sessions
- **Rate Limiting**: API protection with intelligent request limiting

### Security & Performance

- **API Key Security**: Environment-based configuration
- **CORS Protection**: Secure cross-origin resource sharing
- **Helmet Security**: Enhanced security headers
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: Comprehensive input sanitization

## API Integration

### OpenWeatherMap API

- **Current Weather API**: Real-time weather conditions
- **5-Day Forecast API**: Extended weather predictions
- **Geocoding API**: City search and coordinates resolution

**API Features Used:**

- Current weather data (temperature, humidity, pressure, wind)
- Weather descriptions and icons
- 5-day forecast with 3-hour intervals
- City search with country/state information
- Weather alerts and warnings

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm)
- OpenWeatherMap API key (free at [openweathermap.org](https://openweathermap.org/api))

### Local Development

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd weather-dashboard
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env and add your OpenWeatherMap API key
   ```

4. **Start the development server**

   ```bash
   pnpm run dev
   ```

5. **Access the application**
   ```
   http://localhost:8080
   ```

## Docker Deployment

### Using Docker Compose (Recommended)

The easiest way to run the application with load balancing:

1. **Clone and setup environment**
   ```bash
   git clone <your-repo-url>
   cd weather-dashboard
   cp .env.example .env
   # Edit .env and add your OpenWeatherMap API key
   ```

2. **Run with Docker Compose**
   ```bash
   docker compose up -d
   ```

3. **Access the application**
   ```bash
   curl http://localhost:8080/health
   # Open http://localhost:8080 in browser
   ```

4. **Stop the services**
   ```bash
   docker compose down
   ```

### Docker Compose Configuration

The `docker-compose.yml` provides:
- **Two web servers** (`web01`, `web02`) for load balancing
- **HAProxy load balancer** with health checks
- **Automatic environment variable loading** from `.env` file
- **Health checks** for all services
- **Network isolation** with custom bridge network

### Using Pre-built Image from Docker Hub

**Repository**: `uwenayoallain/weather-dashboard:latest`

1. **Pull and run directly**
   ```bash
   docker run -d \
     --name weather-app \
     -p 8080:8080 \
     -e OPENWEATHER_API_KEY=your_api_key_here \
     uwenayoallain/weather-dashboard:latest
   ```

2. **Update docker-compose.yml to use pre-built image**
   ```yaml
   services:
     web01:
       image: uwenayoallain/weather-dashboard:latest
       # ... rest of configuration
   ```

### Building Your Own Image

1. **Build the Docker image**
   ```bash
   docker build -t your-username/weather-dashboard:latest .
   ```

2. **Test locally**
   ```bash
   docker run -p 8080:8080 -e OPENWEATHER_API_KEY=your_api_key your-username/weather-dashboard:latest
   curl http://localhost:8080/health
   ```

3. **Push to Docker Hub**
   ```bash
   docker login
   docker push your-username/weather-dashboard:latest
   ```

### Docker Hub Information

- **Repository**: `uwenayoallain/weather-dashboard`
- **Tags**: `latest`
- **Image Size**: ~50MB (Alpine-based)
- **Architecture**: linux/amd64

## Load Balancer Deployment

### Server Setup (Web01 & Web02)

1. **SSH into each server**

   ```bash
   ssh user@web-01
   ssh user@web-02
   ```

2. **Pull and run the container**

   ```bash
   # On both Web01 and Web02
   docker pull <dockerhub-username>/weather-dashboard:v1

   docker run -d \
     --name weather-app \
     --restart unless-stopped \
     -p 8080:8080 \
     -e OPENWEATHER_API_KEY=your_api_key_here \
     <dockerhub-username>/weather-dashboard:v1
   ```

3. **Verify container is running**
   ```bash
   docker ps
   curl http://localhost:8080/health
   ```

### HAProxy Configuration (Lb01)

1. **Update HAProxy configuration** (`/etc/haproxy/haproxy.cfg`):

   ```haproxy
   global
       daemon
       maxconn 4096

   defaults
       mode http
       timeout connect 5000ms
       timeout client 50000ms
       timeout server 50000ms
       option httplog

   frontend weather_frontend
       bind *:80
       default_backend weather_backend

   backend weather_backend
       balance roundrobin
       option httpchk GET /health
       http-check expect status 200
       server web01 172.20.0.11:8080 check
       server web02 172.20.0.12:8080 check
   ```

2. **Reload HAProxy**

   ```bash
   docker exec -it lb-01 sh -c 'haproxy -sf $(pidof haproxy) -f /etc/haproxy/haproxy.cfg'
   ```

3. **Verify load balancing**
   ```bash
   # Test multiple requests to see round-robin distribution
   for i in {1..10}; do
     curl -s http://localhost/health | grep -o '"version":"[^"]*"'
     sleep 1
   done
   ```

## Testing & Verification

### Load Balancing Test

```bash
# Test script to verify round-robin load balancing
#!/bin/bash
echo "Testing load balancer distribution..."
for i in {1..20}; do
  response=$(curl -s http://localhost/api/weather/current/Toronto)
  echo "Request $i: $(echo $response | grep -o '"timestamp":"[^"]*"')"
  sleep 0.5
done
```

### Health Check Endpoints

- **Application Health**: `GET /health`
- **API Status**: `GET /api/weather/current/Toronto`

### Expected Load Balancer Behavior

- Requests should alternate between Web01 and Web02
- Failed servers should be automatically removed from rotation
- Health checks should occur every 30 seconds

## API Endpoints

### Weather Data

- `GET /api/weather/current/:city` - Current weather for a city
- `GET /api/weather/forecast/:city` - 5-day forecast for a city
- `POST /api/weather/compare` - Compare weather between cities

### City Search

- `GET /api/cities/search/:query` - Search for cities

### System

- `GET /health` - Application health check

## Environment Variables

| Variable              | Description            | Required | Default    |
| --------------------- | ---------------------- | -------- | ---------- |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key | Yes      | -          |
| `PORT`                | Server port            | No       | 8080       |
| `NODE_ENV`            | Environment mode       | No       | production |

## Security Considerations

### API Key Management

- **Environment Variables**: API keys stored as environment variables, not in code
- **Docker Secrets**: For production, use Docker secrets or external secret management
- **Key Rotation**: Regularly rotate API keys

### Container Security

- **Non-root User**: Application runs as non-privileged user
- **Minimal Base Image**: Alpine Linux for smaller attack surface
- **Security Headers**: Helmet.js for HTTP security headers

### Recommended Production Setup

```bash
# Use Docker secrets for API key
echo "your_api_key" | docker secret create openweather_api_key -

# Run with secret
docker service create \
  --name weather-app \
  --secret openweather_api_key \
  --env OPENWEATHER_API_KEY_FILE=/run/secrets/openweather_api_key \
  <dockerhub-username>/weather-dashboard:v1
```

## Performance Optimizations

### Caching Strategy

- **Browser Caching**: Static assets cached for 1 year
- **API Rate Limiting**: 100 requests per minute per IP
- **Connection Pooling**: Efficient HTTP connections

### Monitoring

- **Health Checks**: Built-in health endpoint
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Response time monitoring

## Development Challenges & Solutions

### 1. API Rate Limiting

**Challenge**: OpenWeatherMap free tier has rate limits
**Solution**: Implemented client-side request debouncing and server-side rate limiting

### 2. Error Handling

**Challenge**: Multiple failure points (API, network, user input)
**Solution**: Comprehensive error handling with user-friendly messages and retry mechanisms

### 3. State Management

**Challenge**: Managing favorites and search state without a framework
**Solution**: Clean class-based architecture with localStorage persistence

### 4. Responsive Design

**Challenge**: Complex layouts on mobile devices
**Solution**: CSS Grid and Flexbox with mobile-first approach

## Testing

### Manual Testing Checklist

- [ ] Search for cities works
- [ ] Current weather displays correctly
- [ ] 5-day forecast loads
- [ ] Favorites can be added/removed
- [ ] City comparison functions
- [ ] Error states display properly
- [ ] Mobile responsiveness
- [ ] Load balancer distributes traffic

### Automated Testing

```bash
# Run basic API tests
pnpm test
```

## Credits & Attribution

- **Weather Data**: [OpenWeatherMap API](https://openweathermap.org/)
- **Icons**: [Font Awesome](https://fontawesome.com/)
- **Fonts**: System fonts for optimal performance

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Demo Video

[Link to 2-minute demo video showing local usage and load balancer deployment]

## Support

For issues and questions:

1. Check the GitHub Issues page
2. Verify your API key is valid
3. Ensure all environment variables are set correctly
4. Check Docker container logs: `docker logs weather-app`
