import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  serverExternalPackages: [
    "pdfkit",
    "fontkit",
    "linebreak",
    "unicode-properties",
    "brotli",
  ],
};

export default nextConfig;