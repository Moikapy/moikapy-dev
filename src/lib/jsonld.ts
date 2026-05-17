import { siteConfig } from "@/lib/config";

/**
 * Generate JSON-LD structured data for the website/blog.
 * Helps search engines and AI agents understand content structure.
 */

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    author: {
      "@type": "Person",
      name: siteConfig.author,
      url: siteConfig.url,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/api/knowledge?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function blogPostJsonLd(post: {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  readingTime: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverImage || `${siteConfig.url}/opengraph-image`,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: siteConfig.author,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/icon-512.webp`,
      },
    },
    url: `${siteConfig.url}/blog/${post.slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/blog/${post.slug}`,
    },
    keywords: post.tags.join(", "),
    wordCount: post.content.split(/\s+/).length,
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.author,
    url: siteConfig.url,
    description: siteConfig.description,
    sameAs: Object.values(siteConfig.socials),
    knowsAbout: [
      "AI Engineering",
      "Large Language Models",
      "Software Development",
      "Game Development",
      "3D Printing",
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}