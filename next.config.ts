import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   // Use serverExternalPackages instead of experimental.serverComponentsExternalPackages
  // serverExternalPackages: ['mongoose', 'bcryptjs', 'next-auth'],
  
  // // Add turbopack configuration (empty is fine for now)
  // turbopack: {},
   
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/photos/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**", // This allows all paths from Cloudinary
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**", // This allows all paths from Cloudinary
      },
       {
        protocol: "https",
        hostname: "plus.unsplash.com",
        port: "",
        pathname: "/**", // This allows all paths from Cloudinary
      },
       {
        protocol: 'https',
        hostname: 'img.abercrombie.com',
        port: '',
        pathname: '/**', // Allows all paths from this hostname
      },
      {
        protocol: 'https',
        hostname: 'www.denon.com',
        port: '',
        pathname: '/**', // Allows all paths from this hostname
      },
    ],
    //  domains: ["res.cloudinary.com", "images.unsplash.com", "img.abercrombie.com"],
  },
};

export default nextConfig;