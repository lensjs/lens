<script setup lang="ts">
import HomeHero from './HomeHero.vue'
import FeatureGrid from './FeatureGrid.vue'
import DashboardShowcase from './DashboardShowcase.vue'
import FrameworkGrid from './FrameworkGrid.vue'
import QuickStartSection from './QuickStartSection.vue'
import PackageGrid from './PackageGrid.vue'
import SiteFooter from './SiteFooter.vue'
</script>

<template>
  <div class="lens-homepage">
    <HomeHero />
    <FeatureGrid />
    <DashboardShowcase />
    <FrameworkGrid />
    <QuickStartSection />
    <PackageGrid />
    <SiteFooter />
  </div>
</template>

<style scoped>
.lens-homepage {
  overflow-x: clip;
}
</style>
