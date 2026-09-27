require('dotenv').config();

const key = process.env.IBM_CLOUD_API_KEY;

console.log('exists:', !!key);
console.log('length:', key ? key.length : 0);
console.log('starts:', key ? key.slice(0, 8) : 'none');