const { webpackConfig } = require('react-documents/dist/src/webpackConfig');
const { join } = require('path');

module.exports = webpackConfig(join(process.cwd(), 'src', 'client', 'index.tsx'));