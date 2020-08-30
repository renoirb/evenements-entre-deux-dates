<template>
  <div>
    <h1>Événements entre deux dates</h1>
    <section>
      <RelativeDateRangeForm
        @calculate="onRelativeDateRangeFormSubmit"
        class="block"
      />
      <hr class="block" />
      <DateRange :distance-dates="distanceDates" class="block" />
      <hr class="block" />
      <div class="block">
        <h2>
          <span>Durée:&nbsp;</span>
          <small>{{ textualDuration }}</small>
        </h2>
        <div
          class="events"
          v-if="nextEvents.length > 1"
        >
          <h3>
            <span>Dates des prochains&nbsp;</span>
            <em>
              {{
                nextEvents[0].toLocaleString({
                  weekday: 'long',
                  locale: dateRangeValues.locale,
                })
              }}s
            </em>
          </h3>
          <ul class="no-bullets">
            <li
              v-for="(date, index) of nextEvents"
              :key="index + '--' + dateRangeValues.locale"
            >
              <!-- Code smellllllls FIXME, please! -->
              <a
                :href="formatCalendar(dateRangeValues, date)"
                :data-date-locale="
                  date.toISODate() +
                  '--' +
                  dateRangeValues.locale
                "
                target="_blank"
              >
                {{
                  date.toRelativeCalendar({
                    locale: dateRangeValues.locale,
                  }) +
                  ', ' +
                  date.toLocaleString({
                    dateStyle: 'medium',
                    locale: dateRangeValues.locale,
                  })
                }}
              </a>
            </li>
          </ul>
        </div>
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
        locale: this.distanceDates.locale.value,
        max: this.distanceDates.max.value,
        min: this.distanceDates.min.value,
        today: this.distanceDates.today.value,
      }
    },
    nextEvents() {
      const unit = 'weeks'
      const count = 1
      const events = createDateTimeCollection({
        count,
        locale: this.distanceDates.locale.value,
        max: this.distanceDates.max.value,
        min: this.distanceDates.min.value,
        unit,
      })
      return [...events]
    },
    textualDuration(): string {
      const interval = toDateTimeInterval(this.dateRangeValues)
      const duration = interval.toDuration(['months', 'days']).toObject()
      return `${duration.months} mois, ${duration.days} jours`
    },
  },
  methods: {
    formatCalendar(dateRange: IDateRange, date: DateTime): string {
      return formatCalendarLink(dateRange, date)
    },
    onRelativeDateRangeFormSubmit({ count, unit, direction }) {
      const inTheFuture = isFuture(direction)
      const today = inTheFuture ? 'min' : 'max'
      const field = inTheFuture ? 'max' : 'min'
      const { locale } = this.dateRangeValues
      const date = createDateTime(count, unit, direction, locale)
      const changeset = {
        [field]: date.toISODate(),
        count,
        direction,
        locale,
        today,
        unit,
      }
      this.changeDateRange(changeset)
      const events = [...this.nextEvents]
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
