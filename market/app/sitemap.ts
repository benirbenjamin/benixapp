import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://watch.benix.space";

  // Static Platform Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore?category=music`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore?category=films`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/service-requests`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  try {
    // 1. Fetch all approved videos (songs, gospel choirs, films, tutorials)
    const videos = await prisma.video.findMany({
      where: { status: "APPROVED" },
      select: { id: true, updatedAt: true },
      orderBy: { views: "desc" },
      take: 1000,
    });

    const videoRoutes: MetadataRoute.Sitemap = videos.map((v) => ({
      url: `${baseUrl}/video/${v.id}`,
      lastModified: v.updatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    }));

    // 2. Fetch all digital products
    const products = await prisma.product.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { salesCount: "desc" },
      take: 500,
    });

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/products/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // 3. Fetch all services
    const services = await prisma.service.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, updatedAt: true },
      take: 500,
    });

    const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
      url: `${baseUrl}/services/${s.id}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // 4. Fetch all channels
    const channels = await prisma.channel.findMany({
      select: { handle: true, updatedAt: true },
      take: 500,
    });

    const channelRoutes: MetadataRoute.Sitemap = channels.map((c) => ({
      url: `${baseUrl}/channel/${c.handle}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...videoRoutes, ...productRoutes, ...serviceRoutes, ...channelRoutes];
  } catch (err) {
    console.warn("Could not generate dynamic sitemap routes from DB:", err);
    return staticRoutes;
  }
}
