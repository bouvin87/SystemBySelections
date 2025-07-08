const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

// Create a test JWT token
const payload = {
  userId: 7,
  tenantId: 1,
  email: "christian.bouvin@eurosystem.se",
  role: "admin"
};

const token = jwt.sign(payload, 'your-secret-key-change-in-production');
console.log('Token:', token);

// Test the API call
fetch('http://localhost:5000/api/kanban/boards/170e606c-bfde-4a72-b619-b84e3028cfd7/columns', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => {
  console.log('Status:', res.status);
  return res.json();
})
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));