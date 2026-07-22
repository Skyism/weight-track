// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web build loads a WASM module; register the extension so
// Metro bundles it as an asset instead of failing to resolve it.
config.resolver.assetExts.push('wasm');

module.exports = config;
