<script setup lang="ts">
import { ref } from 'vue'
import Icon from './Icon.vue'
import { useCopy } from '../composables/useCopy'

const raw = `import { lens } from "@lensjs/express";
import express from "express";

const app = express();

await lens({
  app,
  requestWatcherEnabled: true,
  queryWatcher: {
    enabled: true,
    handler: createPrismaHandler({ provider: "postgresql" }),
  },
});

// Dashboard is live at /lens
app.listen(3000);`

const { copied, copy } = useCopy()
const filename = ref('server.ts')
</script>

<template>
  <div class="lens-herocode">
    <div class="lens-herocode__bar">
      <div class="lens-herocode__dots" aria-hidden="true">
        <span /><span /><span />
      </div>
      <span class="lens-herocode__file">
        <Icon name="file-code" :size="13" /> {{ filename }}
      </span>
      <button
        class="lens-herocode__copy"
        :aria-label="copied ? 'Copied' : 'Copy code'"
        @click="copy(raw)"
      >
        <Icon :name="copied ? 'check' : 'copy'" :size="14" />
      </button>
    </div>
    <pre class="lens-herocode__pre"><code><span class="ln"><span class="k">import</span> { <span class="v">lens</span> } <span class="k">from</span> <span class="s">"@lensjs/express"</span>;</span>
<span class="ln"><span class="k">import</span> <span class="v">express</span> <span class="k">from</span> <span class="s">"express"</span>;</span>
<span class="ln"> </span>
<span class="ln"><span class="k">const</span> <span class="v">app</span> = <span class="fn">express</span>();</span>
<span class="ln"> </span>
<span class="ln"><span class="k">await</span> <span class="fn">lens</span>({</span>
<span class="ln">  <span class="p">app</span>,</span>
<span class="ln">  <span class="p">requestWatcherEnabled</span>: <span class="b">true</span>,</span>
<span class="ln">  <span class="p">queryWatcher</span>: {</span>
<span class="ln">    <span class="p">enabled</span>: <span class="b">true</span>,</span>
<span class="ln">    <span class="p">handler</span>: <span class="fn">createPrismaHandler</span>({ <span class="p">provider</span>: <span class="s">"postgresql"</span> }),</span>
<span class="ln">  },</span>
<span class="ln">});</span>
<span class="ln"> </span>
<span class="ln"><span class="c">// Dashboard is live at /lens</span></span>
<span class="ln"><span class="v">app</span>.<span class="fn">listen</span>(<span class="n">3000</span>);</span></code></pre>
  </div>
</template>

<style scoped>
.lens-herocode {
  border-radius: var(--lens-radius-lg);
  border: 1px solid var(--vp-c-divider);
  overflow: hidden;
  background: #0c0c12;
  box-shadow: var(--lens-shadow-md);
}

.lens-herocode__bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: #16161d;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.lens-herocode__dots {
  display: flex;
  gap: 6px;
}

.lens-herocode__dots span {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.lens-herocode__dots span {
  background: rgba(255, 255, 255, 0.18);
}

.lens-herocode__file {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-right: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 0.76rem;
  color: rgba(255, 255, 255, 0.5);
}

.lens-herocode__copy {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  color: rgba(255, 255, 255, 0.6);
  transition: all var(--lens-dur-fast) var(--lens-ease);
}

.lens-herocode__copy:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.lens-herocode__pre {
  margin: 0;
  padding: 1.15rem 1.35rem;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 0.82rem;
  line-height: 1.75;
  color: #e6e6ea;
}

.lens-herocode__pre code {
  font-family: inherit;
}

.ln {
  display: block;
}

.k { color: #c792ea; }
.s { color: #7ee787; }
.fn { color: #82aaff; }
.p { color: #f5a3c7; }
.v { color: #e6e6ea; }
.b { color: #ffcb6b; }
.n { color: #ff9d78; }
.c { color: #6a6a78; font-style: italic; }
</style>
