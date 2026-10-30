/** @type {import("next").NextConfig} */
const apiServer = process.env.API_SERVER_URL?.replace(/\/$/, "");

module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return apiServer ? [{ source: "/api/:path*", destination: `${apiServer}/api/:path*` }] : [];
  },
};
