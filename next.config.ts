import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist has complex internal imports; keep it out of the server bundle.
  serverExternalPackages: ['pdfjs-dist'],
};

export default nextConfig;
