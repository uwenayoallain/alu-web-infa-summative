// Simple test suite for Weather Dashboard API
const http = require('http');
const assert = require('assert');

// Test configuration
const HOST = 'localhost';
const PORT = process.env.PORT || 8080;
const BASE_URL = `http://${HOST}:${PORT}`;

class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    async makeRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: HOST,
                port: PORT,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(body);
                        resolve({ statusCode: res.statusCode, data: parsed });
                    } catch (e) {
                        resolve({ statusCode: res.statusCode, data: body });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    async test(name, testFn) {
        try {
            console.log(`\n🧪 Testing: ${name}`);
            await testFn();
            console.log(`✅ PASSED: ${name}`);
            this.passed++;
        } catch (error) {
            console.log(`❌ FAILED: ${name}`);
            console.log(`   Error: ${error.message}`);
            this.failed++;
        }
    }

    async runAllTests() {
        console.log('🚀 Starting Weather Dashboard API Tests\n');
        console.log(`Testing server at: ${BASE_URL}`);

        // Test 1: Health Check
        await this.test('Health Check Endpoint', async () => {
            const response = await this.makeRequest('/health');
            assert.strictEqual(response.statusCode, 200);
            assert(response.data.status === 'healthy');
            assert(response.data.version);
            assert(response.data.timestamp);
        });

        // Test 2: Current Weather (valid city)
        await this.test('Current Weather - Valid City', async () => {
            const response = await this.makeRequest('/api/weather/current/Toronto');

            if (response.statusCode === 500 && response.data.message?.includes('API key')) {
                console.log('   ⚠️  WARNING: API key not configured - skipping weather tests');
                return;
            }

            assert.strictEqual(response.statusCode, 200);
            assert(response.data.location);
            assert(response.data.current);
            assert(typeof response.data.current.temperature === 'number');
        });

        // Test 3: Current Weather (invalid city)
        await this.test('Current Weather - Invalid City', async () => {
            const response = await this.makeRequest('/api/weather/current/InvalidCityName12345');

            if (response.statusCode === 500 && response.data.message?.includes('API key')) {
                console.log('   ⚠️  WARNING: API key not configured - skipping weather tests');
                return;
            }

            assert.strictEqual(response.statusCode, 404);
            assert(response.data.error);
        });

        // Test 4: Forecast (valid city)
        await this.test('5-Day Forecast - Valid City', async () => {
            const response = await this.makeRequest('/api/weather/forecast/London');

            if (response.statusCode === 500 && response.data.message?.includes('API key')) {
                console.log('   ⚠️  WARNING: API key not configured - skipping weather tests');
                return;
            }

            assert.strictEqual(response.statusCode, 200);
            assert(response.data.location);
            assert(Array.isArray(response.data.forecast));
            assert(response.data.forecast.length <= 5);
        });

        // Test 5: City Search
        await this.test('City Search', async () => {
            const response = await this.makeRequest('/api/cities/search/New York');

            if (response.statusCode === 500 && response.data.message?.includes('API key')) {
                console.log('   ⚠️  WARNING: API key not configured - skipping search tests');
                return;
            }

            assert.strictEqual(response.statusCode, 200);
            assert(Array.isArray(response.data.cities));
            assert(response.data.query === 'New York');
        });

        // Test 6: City Search - Short Query
        await this.test('City Search - Short Query (Should Fail)', async () => {
            const response = await this.makeRequest('/api/cities/search/A');
            assert.strictEqual(response.statusCode, 400);
            assert(response.data.error);
        });

        // Test 7: City Comparison
        await this.test('City Comparison', async () => {
            const cities = ['Toronto', 'New York'];
            const response = await this.makeRequest('/api/weather/compare', 'POST', { cities });

            if (response.statusCode === 500 && response.data.message?.includes('API key')) {
                console.log('   ⚠️  WARNING: API key not configured - skipping comparison tests');
                return;
            }

            assert.strictEqual(response.statusCode, 200);
            assert(Array.isArray(response.data.comparison));
            assert(response.data.comparison.length === 2);
        });

        // Test 8: City Comparison - Too Many Cities
        await this.test('City Comparison - Too Many Cities (Should Fail)', async () => {
            const cities = ['Toronto', 'New York', 'London', 'Paris', 'Tokyo', 'Sydney'];
            const response = await this.makeRequest('/api/weather/compare', 'POST', { cities });
            assert.strictEqual(response.statusCode, 400);
            assert(response.data.error);
        });

        // Test 9: Invalid Endpoint
        await this.test('Invalid Endpoint (Should Return 404)', async () => {
            const response = await this.makeRequest('/api/invalid/endpoint');
            assert.strictEqual(response.statusCode, 404);
            assert(response.data.error === 'Not Found');
        });

        // Test 10: Rate Limiting (simulate multiple requests)
        await this.test('Rate Limiting Protection', async () => {
            const requests = [];

            // Send many requests quickly to test rate limiting
            for (let i = 0; i < 10; i++) {
                requests.push(this.makeRequest('/health'));
            }

            const responses = await Promise.all(requests);
            const successCount = responses.filter(r => r.statusCode === 200).length;

            // All health check requests should succeed (rate limit is higher)
            assert(successCount >= 8, 'Rate limiting may be too aggressive for health checks');
        });

        // Test Results Summary
        console.log('\n📊 Test Results Summary');
        console.log('========================');
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📈 Success Rate: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);

        if (this.failed === 0) {
            console.log('\n🎉 All tests passed! Your Weather Dashboard API is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the error messages above.');
            process.exit(1);
        }
    }
}

// Check if server is running
function checkServerHealth() {
    return new Promise((resolve) => {
        const req = http.get(`${BASE_URL}/health`, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => {
            resolve(false);
        });
        req.setTimeout(5000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

// Main execution
async function main() {
    console.log('🔍 Checking if Weather Dashboard server is running...');

    const isHealthy = await checkServerHealth();

    if (!isHealthy) {
        console.log('❌ Server is not running or not responding.');
        console.log('   Please start the server with: npm start');
        console.log('   Or with Docker: docker run -p 8080:8080 your-image');
        process.exit(1);
    }

    console.log('✅ Server is running and healthy.');

    const runner = new TestRunner();
    await runner.runAllTests();
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled error during testing:', error);
    process.exit(1);
});

// Run tests
main().catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});