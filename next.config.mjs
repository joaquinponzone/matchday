/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "crests.football-data.org",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "api.fifa.com",
      },
      {
        protocol: "https",
        hostname: "api.promiedos.com.ar",
      },
    ],
  },
}

export default nextConfig
