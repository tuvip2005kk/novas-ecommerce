const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // fallback if running older Node, but Node 18+ has native fetch

const secret = process.env.JWT_SECRET || 'sanitary-store-secret-key-2024';

// 1. Generate Token
const token = jwt.sign(
    { sub: 1, email: 'admin@novas.vn', role: 'ADMIN' },
    secret,
    { expiresIn: '7d' }
);
console.log('Crafted Token:', token);

// 2. Test Remote Render API
async function testRender() {
    console.log('\n--- Testing Render API ---');
    try {
        const res = await fetch('https://novas-ecommerce.onrender.com/api/categories', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'API Test Category',
                slug: 'api-test-category-' + Date.now()
            })
        });
        const status = res.status;
        const text = await res.text();
        console.log(`Render Response Status: ${status}`);
        console.log(`Render Response Body:`, text);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}
testRender();
