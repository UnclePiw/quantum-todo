/** @type {import("next").NextConfig} */
const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
const apiServer = process.env.API_SERVER_URL?.replace(/\/$/, "");
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "quantum-todo";

const nextConfig = {
  reactStrictMode: true,
};

if (isGitHubPages) {
  nextConfig.output = "export";
  nextConfig.basePath = `/${repositoryName}`;
  nextConfig.trailingSlash = true;
} else {
  nextConfig.rewrites = async () => (
    apiServer ? [{ source: "/api/:path*", destination: `${apiServer}/api/:path*` }] : []
  );
}

module.exports = nextConfig;
