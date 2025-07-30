# Weather Dashboard 🌤️

A simple weather application that provides real-time weather data and forecasts using the OpenWeatherMap API. Built with Node.js, Express, and vanilla JavaScript with load balancing for high availability.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- OpenWeatherMap API key (free at [openweathermap.org](https://openweathermap.org/api))

### Setup

1. **Clone and configure**
   ```bash
   git clone <your-repo-url>
   cd weather-dashboard
   cp .env.example .env
   # Edit .env and add your OpenWeatherMap API key
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Main app: http://localhost
   - Health check: http://localhost/health
   - Load balancer health: http://localhost/lb-health

## Features

- **Current Weather**: Real-time weather for any city
- **5-Day Forecast**: Extended weather predictions  
- **City Search**: Find cities with auto-suggestions
- **Favorites**: Save your favorite locations
- **City Comparison**: Compare weather across multiple cities
- **Load Balancing**: Two web servers for reliability

## Architecture

- **web01**: Node.js application server (port 8084)
- **web02**: Node.js application server (port 8085)  
- **loadbalancer**: HAProxy distributing traffic between web01 and web02

## Testing

### Check if everything is working
```bash
# Check service status
docker-compose ps

# Test load balancing
for i in {1..6}; do
  curl -s http://localhost/api/weather/current/london | grep -o '"server_id":"[^"]*"'
  sleep 1
done
```

### Test failover
```bash
# Stop one server
docker-compose stop web01

# App should still work via web02
curl http://localhost/health

# Restart the server
docker-compose start web01
```

## API Endpoints

- `GET /health` - Application health check
- `GET /lb-health` - Load balancer health check
- `GET /api/weather/current/:city` - Current weather
- `GET /api/weather/forecast/:city` - 5-day forecast
- `POST /api/weather/compare` - Compare cities
- `GET /api/cities/search/:query` - Search cities

## Environment Variables

Create `.env` file with:
```
OPENWEATHER_API_KEY=your_api_key_here
```

## Deployment

### Local Development
```bash
docker-compose up -d
```

### Production Deployment
1. Build and push to Docker Hub:
   ```bash
   docker build -t <username>/weather-dashboard:v1 .
   docker push <username>/weather-dashboard:v1
   ```

2. Deploy on servers:
   ```bash
   # On web-01 and web-02
   docker pull <username>/weather-dashboard:v1
   docker run -d --name weather-app -p 8080:8080 \
     -e OPENWEATHER_API_KEY=your_key \
     <username>/weather-dashboard:v1
   ```

3. Configure load balancer (lb-01) with the provided `haproxy.cfg`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Services won't start | `docker-compose down && docker-compose up -d` |
| 502 errors | Check `docker-compose logs` |
| API not working | Verify your API key in `.env` |
| Load balancer not working | Check both web servers are healthy |

## Commands

```bash
# Start services
docker-compose up -d

# Stop services  
docker-compose down

# View logs
docker-compose logs

# Check status
docker-compose ps

# Restart a service
docker-compose restart web01
```

## Credits

- **Weather Data**: [OpenWeatherMap API](https://openweathermap.org/)
- **Icons**: [Font Awesome](https://fontawesome.com/)

## License

MIT License - Educational purposes