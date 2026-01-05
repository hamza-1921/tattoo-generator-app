import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Fixed key name: Use the stable 'serverExternalPackages' [citation:2]
  serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node'],

  // 2. Add an empty turbopack config to acknowledge you are using Turbopack [citation:4]
  turbopack: {},

  // 3. Your existing webpack configuration (exclude problematic packages)
  webpack: (config, { isServer }) => {
    if (isServer && config.externals) {
      const externals = Array.isArray(config.externals) 
        ? config.externals 
        : [config.externals];
      
      config.externals = [
        ...externals,
        'web-worker',
        '@eshaz/web-worker',
        'audio-decode',
        '@wasm-audio-decoders/common',
        '@wasm-audio-decoders/ogg-vorbis'
      ];
    }
    return config;
  },
};

export default nextConfig;