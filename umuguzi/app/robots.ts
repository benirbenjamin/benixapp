import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://watch.benix.space";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/studio/", "/dashboard/", "/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/studio/", "/dashboard/", "/api/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/admin/", "/studio/", "/dashboard/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
