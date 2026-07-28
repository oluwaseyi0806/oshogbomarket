export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/profile", "/messages", "/chat"],
    },
    sitemap: "https://oshogbomarket.com.ng/sitemap.xml",
  };
}