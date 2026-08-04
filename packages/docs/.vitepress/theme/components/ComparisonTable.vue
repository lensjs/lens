<script setup lang="ts">
import Icon from './Icon.vue'

interface Row {
  label: string
  values: (string | boolean)[]
  note?: string
}

defineProps<{ columns: string[]; rows: Row[]; highlight?: number }>()
</script>

<template>
  <div class="lens-compare">
    <table>
      <thead>
        <tr>
          <th />
          <th
            v-for="(col, i) in columns"
            :key="col"
            :class="{ 'is-highlight': highlight === i }"
          >
            {{ col }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.label">
          <th scope="row">
            {{ row.label }}
            <span v-if="row.note" class="lens-compare__note">{{ row.note }}</span>
          </th>
          <td
            v-for="(val, i) in row.values"
            :key="i"
            :class="{ 'is-highlight': highlight === i }"
          >
            <template v-if="typeof val === 'boolean'">
              <Icon
                v-if="val"
                name="check"
                :size="17"
                class="lens-compare__yes"
              />
              <span v-else class="lens-compare__no" aria-hidden="true">—</span>
            </template>
            <template v-else>{{ val }}</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.lens-compare {
  margin: 1.75rem 0;
  overflow-x: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--lens-radius-lg);
  box-shadow: var(--lens-shadow-sm);
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

thead th {
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
  padding: 0.85rem 1rem;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
}

tbody th {
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
}

th,
td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  text-align: center;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

tbody tr:last-child th,
tbody tr:last-child td {
  border-bottom: none;
}

.is-highlight {
  background: var(--vp-c-brand-softer);
}

thead .is-highlight {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.lens-compare__yes {
  color: var(--vp-c-success-1);
}

.lens-compare__no {
  color: var(--vp-c-text-3);
}

.lens-compare__note {
  display: block;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--vp-c-text-3);
  margin-top: 0.15rem;
}
</style>
