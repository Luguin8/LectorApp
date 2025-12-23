// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Le decimos al bundler que acepte archivos .txt como assets
config.resolver.assetExts.push('txt');

module.exports = config;