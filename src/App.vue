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
        <dd>{{ textualDuration }}</dd>
      </dl>
      <DateRange :distance-dates="distanceDates" class="block" />
      <div class="block" v-if="nextEvents.length > 1">
        <h2>{{ nextEvents[0].toLocaleString({ weekday: 'long' }) }}s</h2>
        <ul class="no-bullets">
          <li v-for="(date, index) of nextEvents" :key="index">
            <a :href="formatCalendar(dateRangeValues, date)" target="_blank">{{
              date.toISODate()
            }}</a>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { DateTime, Interval } from 'luxon'
import {
  default as useDistanceDates,
  createDateTime,
  isFuture,
  createDateTimeCollection,
  formatCalendarLink,
  IDateRange,
  toDateTimeInterval,
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
      // logger: console,
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
  computed: {
    dateRangeValues(): IDateRange {
      return {
        direction: this.distanceDates.direction.value,
        max: this.distanceDates.max.value,
        min: this.distanceDates.min.value,
        today: this.distanceDates.today.value,
      }
    },
    nextEvents() {
      const unit = 'weeks'
      const count = 1
      const events = createDateTimeCollection(
        this.distanceDates.min.value,
        this.distanceDates.max.value,
        count,
        unit,
      )
      return [...events]
    },
    textualDuration(): string {
      const interval = toDateTimeInterval(this.dateRangeValues)
      const duration = interval.toDuration(['months', 'days']).toObject()
      return `${duration.months} mois, ${duration.days} jours`
    }
  },
  methods: {
    formatCalendar(dateRange: IDateRange, date: DateTime): string {
      return formatCalendarLink(dateRange, date)
    },
    onRelativeDateRangeFormSubmit({ count, unit, direction }) {
      const inTheFuture = isFuture(direction)
      const today = inTheFuture ? 'min' : 'max'
      const field = inTheFuture ? 'max' : 'min'
      const date = createDateTime(count, unit, direction)
      const changeset = {
        count,
        unit,
        direction,
        today,
        [field]: date.toISODate(),
      }
      this.changeDateRange(changeset)
      const events = [...this.nextEvents]
      console.log('onRelativeDateRangeFormSubmit', events)
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
ul.no-bullets {
  list-style-type: none;
}
</style>
