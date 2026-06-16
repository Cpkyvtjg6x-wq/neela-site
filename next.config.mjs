/** @type {import('next').NextConfig} */
const nextConfig = {
  // On ne bloque pas le build sur le lint (on garde le typage TS actif).
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Permet d'envoyer les enregistrements audio via les Server Actions.
    serverActions: { bodySizeLimit: "16mb" },
  },
};

export default nextConfig;
