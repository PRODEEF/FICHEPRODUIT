// Plain JS re-export of the compiled NestJS serverless handler.
// nest build compiles src/serverless.ts → dist/serverless.js
module.exports = require('../dist/serverless');
