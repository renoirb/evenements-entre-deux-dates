<template>
  <select
    data-component-name="SelectDateRangeUnit"
    :data-current-value="value"
    :name="name"
    :id="name"
    @change="$emit('change', { name, value: $event.target.value })"
  >
    <option
      v-for="(unit, index) of durationUnits"
      :key="index"
      :value="unit"
      :selected="unit === value"
      :data-relative-unit="unit"
    >
      {{ unit }}
    </option>
  </select>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import {
  durationUnits,
  isInDurationUnits,
  IDurationUnit,
} from '../use-distance-dates'

export default defineComponent({
  name: 'SelectDateRangeUnit',
  props: {
    value: {
      type: String as PropType<IDurationUnit>,
      validator: (v: IDurationUnit) => isInDurationUnits(v),
      default: 'months',
    },
    name: {
      required: true,
    },
  },
  emits: {
    change: ({ value }) => isInDurationUnits(value),
  },
  data() {
    return {
      durationUnits,
    }
  },
})
</script>
