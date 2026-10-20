// Vercel serverless entry - forwards every request to the compiled NestJS app
module.exports = require('../dist/src/serverless').default;
