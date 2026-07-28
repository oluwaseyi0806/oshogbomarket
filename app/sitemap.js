export default function sitemap() {
  return [
    {
      url: "https://oshogbomarket.com.ng",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://oshogbomarket.com.ng/artisans",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://oshogbomarket.com.ng/legal",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}