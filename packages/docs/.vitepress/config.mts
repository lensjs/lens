import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Lens",
  description:
    "A Nodejs Framework Agonstic Package To Monitor Your Application",
  themeConfig: {
    nav: [{ text: "Home", link: "/" }],
    sidebar: [
      {
        text: "Getting Started",
        collapsed: true,
        items: [
          { text: "What is Lens?", link: "/getting-started/what-is-lens" },
          { text: "Quick Start", link: "/getting-started/quick-start" },
        ],
      },
      {
        text: "Adapters",
        collapsed: true,
        items: [
          {
            text: "Express",
            collapsed: true,
            items: [
              { text: "Installation", link: "/adapters/express/installation" },
              {
                text: "Configuration",
                link: "/adapters/express/configuration",
              },
            ],
          },
          {
            text: "NestJS",
            collapsed: true,
            items: [
              { text: "Installation", link: "/adapters/nestjs/installation" },
              { text: "Configuration", link: "/adapters/nestjs/configuration" },
            ],
          },
          {
            text: "Fastify",
            collapsed: true,
            items: [
              { text: "Installation", link: "/adapters/fastify/installation" },
              {
                text: "Configuration",
                link: "/adapters/fastify/configuration",
              },
            ],
          },
          {
            text: "AdonisJS",
            collapsed: true,
            items: [
              { text: "Installation", link: "/adapters/adonis/installation" },
            ],
          },
        ],
      },
      {
        text: "Watchers",
        collapsed: true,
        items: [
          {
            text: "Installation",
            link: "/handlers/installation",
          },
          {
            text: "Query",
            collapsed: true,
            items: [
              {
                text: "Express",
                link: "/handlers/query/express",
              },
              {
                text: "Fastify",
                link: "/handlers/query/fastify",
              },
              {
                text: "AdonisJS",
                link: "/handlers/query/adonis",
              },
              {
                text: "NestJS",
                link: "/handlers/query/nestjs",
              },
            ],
          },
          {
            text: "Cache",
            collapsed: true,
            items: [
              {
                text: "Express",
                link: "/handlers/cache/express",
              },
              {
                text: "Fastify",
                link: "/handlers/cache/fastify",
              },
              {
                text: "AdonisJS",
                link: "/handlers/cache/adonis",
              },
              {
                text: "NestJS",
                link: "/handlers/cache/nestjs",
              },
            ],
          },
          {
            text: "Exception",
            collapsed: true,
            items: [
              {
                text: "Express",
                link: "/handlers/exception/express",
              },
              {
                text: "AdonisJS",
                link: "/handlers/exception/adonis",
              },
              {
                text: "NestJS",
                link: "/handlers/exception/nestjs",
              },
              {
                text: "Fastify",
                link: "/handlers/exception/fastify",
              },
            ],
          },
        ],
      },
      {
        text: "UI Interaction",
        link: "/ui-interaction",
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/lensjs/lens" }],

    docFooter: {
      prev: "Previous",
      next: "Next",
    },
  },
  sitemap: {
    hostname: "https://lensjs.vercel.app",
  },
});
