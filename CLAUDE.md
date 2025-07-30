# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Management
- Use `pnpm` as the package manager (specified in package.json)
- Install dependencies: `pnpm install`
- Install dev dependencies: `pnpm install --dev`

### Development Server
- Start development server: `pnpm run dev` (uses nodemon for auto-reload)
- Start production server: `pnpm start`
- Run tests: `pnpm test`

### Environment Setup
- Copy `.env.example` to `.env` and set required environment variables
- Required: `OPENWEATHER_API_KEY` from OpenWeatherMap
- Optional: `PORT` (defaults to 8080), `NODE_ENV` (defaults to production)

### Docker Commands
- Build image: `docker build -t weather-dashboard .`
- Run container: `docker run -p 8080:8080 -e OPENWEATHER_API_KEY=your_key weather-dashboard`
- Health check endpoint: `/health`

## Architecture Overview

### Backend (Node.js/Express)
- **Main server**: `server.js` - Express.js API server with security middleware
- **API endpoints**: RESTful weather API with OpenWeatherMap integration
- **Security**: Helmet.js, CORS, rate limiting (100 req/min per IP)
- **Error handling**: Comprehensive API error handling with user-friendly messages

### Frontend (Vanilla JavaScript)
- **Main app**: `public/app.js` - Single-page application using ES6 classes
- **HTML**: `public/index.html` - Responsive layout with Font Awesome icons
- **CSS**: `public/styles.css` - Modern CSS with mobile-first design
- **State management**: Local class state + localStorage for favorites

### Key API Endpoints
- `GET /health` - Health check for load balancers
- `GET /api/weather/current/:city` - Current weather data
- `GET /api/weather/forecast/:city` - 5-day forecast
- `POST /api/weather/compare` - Compare up to 5 cities
- `GET /api/cities/search/:query` - City search with autocomplete

### Data Flow
1. Frontend makes API calls to Express server
2. Server validates input and calls OpenWeatherMap API
3. Server transforms/processes weather data
4. Structured JSON response sent to frontend
5. Frontend updates DOM and manages local state

## Testing Strategy

### Manual Testing
- Run `pnpm test` for basic API endpoint tests
- Test file validates all major endpoints and error cases
- Includes API key validation and rate limiting tests

### Load Balancer Testing
- Designed for HAProxy deployment across multiple servers
- Health checks every 30 seconds on `/health` endpoint
- Round-robin distribution expected

## Important Notes

### Security Considerations
- API keys must be set as environment variables, never hardcoded
- Rate limiting protects against API abuse
- CSP headers configured for external resources (OpenWeatherMap, Font Awesome)
- Non-root Docker user for container security

### External Dependencies
- **OpenWeatherMap API**: Current weather, forecast, and geocoding
- **Font Awesome**: Icons via CDN
- **Node.js packages**: See package.json for full list

### Error Handling
- Client-side: User-friendly error messages with retry functionality
- Server-side: Comprehensive error logging and HTTP status codes
- API validation: Input sanitization and parameter validation

### Deployment Architecture
- Supports containerized deployment with Docker
- Configured for load balancer setup (HAProxy)
- Health check endpoint for monitoring
- Environment-based configuration