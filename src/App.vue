<template>
  <div>
    <h1>Événements entre deux dates</h1>
    <DateRange :distance-dates="distanceDates" :duration="duration" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import useDistanceDates from './use-distance-dates.ts'
import DateRange from './components/DateRange.vue'

export default defineComponent({
  name: 'App',
  components: {
    DateRange,
  },
  setup() {
    const useDistanceDatesOptions = {
      logger: console,
    }
    const { distanceDates, duration } = useDistanceDates(
      location,
      useDistanceDatesOptions,
    )
    return {
      distanceDates,
      duration,
    }
  },
})
</script>
