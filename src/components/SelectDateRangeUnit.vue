<template>
  <select
    :name="name"
    @change="$emit('change', { name, value: $event.target.value })"
  >
    <option
      v-for="(item, index) of durationUnits"
      :key="index"
      :value="item"
      :selected="item === value"
    >
      {{ item }}
    </option>
  </select>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import {
  durationUnits,
  isInDurationUnits,
} from '../use-distance-dates.ts'

export default defineComponent({
  name: 'SelectDateRangeUnit',
  props: {
    name: {
      required: true,
    },
    value: {
      required: true,
      validator(value) {
        return isInDurationUnits(value)
      }
    }
  },
  emits: {
    change: ({ name, value }) => {
      return isInDurationUnits(value)
    }
  },
  data() {
    return {
      durationUnits,
    }
  },
  methods: {
    translate(string) {

    }
  }
})
</script>
