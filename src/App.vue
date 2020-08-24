<template>
  <div>
    <h1>Événements entre deux dates</h1>
    <section>
      <RelativeDateRangeForm
        @calculate="onRelativeDateRangeFormSubmit"
        class="block"
      />
      <hr class="block" />
      <dl class="block">
        <dt>Résultat:</dt>
        <dd>
          {{ duration }}
          <span>{{ distanceDates.unit.value }}</span>
        </dd>
      </dl>
      <DateRange :distance-dates="distanceDates" class="block" />
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import {
  default as useDistanceDates,
  createDateTime,
  isFuture,
} from './use-distance-dates.ts'
import DateRange from './components/DateRange.vue'
import RelativeDateRangeForm from './components/RelativeDateRangeForm.vue'

export default defineComponent({
  name: 'App',
  components: {
    DateRange,
    RelativeDateRangeForm,
  },
  setup() {
    const useDistanceDatesOptions = {
      logger: console,
    }
    const { changeDateRange, distanceDates, duration } = useDistanceDates(
      location,
      useDistanceDatesOptions,
    )
    return {
      changeDateRange,
      distanceDates,
      duration,
    }
  },
  methods: {
    onRelativeDateRangeFormSubmit({
      relativeCount,
      relativeUnit,
      relativeDirection,
    }) {
      const today = relativeDirection === 'FUTURE' ? 'min' : 'max'
      const field = relativeDirection === 'FUTURE' ? 'max' : 'min'
      const inTheFuture = isFuture(relativeDirection)
      const date = createDateTime(
        relativeCount,
        relativeUnit,
        relativeDirection,
      )
      const changeset = {
        count: relativeCount,
        unit: relativeUnit,
        direction: relativeDirection,
        today,
        [field]: date.toISODate(),
      }
      console.log('onRelativeDateRangeFormSubmit', {
        inTheFuture,
        today,
        date,
        toISODate: date.toISODate(),
        recv: {
          relativeCount,
          relativeUnit,
          relativeDirection,
        },
        changeset,
      })
      this.changeDateRange(changeset)
    },
  },
})
</script>

<style scoped>
section {
  background-color: #fff;
  max-width: 800px;
  margin: 50px auto;
  padding: 40px;
  border: 1px solid #777;
}
.block + .block {
  margin-top: 30px;
}
</style>
