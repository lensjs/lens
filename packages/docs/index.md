---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Lens"
  text: "A Framework-Agnostic Monitoring Tool for Node.js Applications"
  tagline: Effortlessly monitor requests, database queries, and more with a beautiful dashboard.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/quick-start

features:
  - title: Requests
    details: Easily log and inspect all incoming request information, including headers, body, and response.
  - title: Database Queries
    details: Gain insights into your database interactions by monitoring query performance and viewing detailed query information.
  - title: Cache
    details: Keep track of your caching layer with detailed monitoring of cache operations and their performance.
  - title: Exception Handling
    details: Monitor and report exceptions providing detailed insights into errors within your application.
    link: /handlers/exception/adonis
  - title: Extensible
    details: Tailor Lens to your specific needs by creating custom adapters for new frameworks, data stores, and watchers for unique events.
---
