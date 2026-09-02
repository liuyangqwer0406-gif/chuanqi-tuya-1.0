import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";
let repoName = "";

if (isGithubActions && process.env.GITHUB_REPOSITORY) {
  repoName = process.env.GITHUB_REPOSITORY.replace(/.*?\//, "");
}

const basePath = repoName ? `/${repoName}` : undefined;
const assetPrefix = repoName ? `/${repoName}/` : undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["127.0.0.1"],
  webpack(config, { dev }) {
    config.module.rules.push(
      { test: /\.html$/i, resourceQuery: /raw/, type: "asset/source" },
      { test: /\.js$/i, resourceQuery: /raw/, type: "asset/source" },
      {
        test: /\.wgsl$/i,
        loader: "@vgpu/wgsl/loader-webpack",
        options: { minify: !dev },
      },
    );
    return config;
  },
};

export default nextConfig;
