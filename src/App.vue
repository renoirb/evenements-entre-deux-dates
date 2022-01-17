<template>
  <div>
    <h1>Événements entre deux dates</h1>
    <section>
      <div class="block">
        <h2>Nouveau calcul</h2>
        <details>
          <summary>Générique</summary>
          <RelativeDateRangeForm @calculate="onCalculate" />
        </details>
        <details>
          <summary>Pré-natalité</summary>
          <RelativeDateRangeForm
            @calculate="onCalculate"
            :for-pregnancy="true"
          />
        </details>
        <hr v-if="duration > 0" />
      </div>
      <div class="block" v-if="duration > 0">
        <h2>
          Calcul
          <span v-if="isPregnancy"> de pré-natalité</span>
          <span v-if="!isPregnancy" :title="duration + ' jours'">
            couvrant {{ durationText }}
          </span>
        </h2>
        <DateRange :distance-dates="distanceDates" :pregnancy="pregnancy" />
        <hr />
      </div>
      <div class="block" v-if="isPregnancy">
        <h3>Pré-natalité</h3>
        <dl>
          <dt>Date prévue selon l’échographie</dt>
          <dd>
            <time
              :lang="distanceDatesCopy.locale"
              :datetime="pregnancyExpectedDueDate.toISODate()"
            >
              {{ pregnancyExpectedDueDateText }}
            </time>
          </dd>
          <dt>Semaine numéro</dt>
          <dd>{{ currentWeekNumber }}</dd>
          <dt>Jours avant prochaine semaine</dt>
          <dd>{{ daysTillNextWeek }}</dd>
        </dl>
        <hr />
      </div>
      <div class="block" v-if="nextEventsCount > 0">
        <div class="events" v-if="nextEventsCount > 1">
          <h3>
            <span>Dates des prochains&nbsp;</span>
            <em>
              {{
                nextEvents[0].toLocaleString({
                  weekday: 'long',
                  locale: distanceDatesCopy.locale,
                })
              }}s
            </em>
          </h3>
          <ul class="no-bullets">
            <li
              v-for="(date, index) of nextEvents"
              :key="index + '--' + distanceDatesCopy.locale"
            >
              <!-- Code smellllllls FIXME, please! -->
              <time> ({{ toWeekNumber(date) }})&nbsp; </time>
              <a
                :href="formatCalendarLink(distanceDatesCopy, date)"
                :title="formatCalendarEventText(distanceDatesCopy, date)"
                target="_blank"
              >
                <time
                  :lang="distanceDatesCopy.locale"
                  :datetime="date.toISODate()"
                >
                  {{
                    date.toRelativeCalendar({
                      locale: distanceDatesCopy.locale,
                    }) +
                    ', ' +
                    date.toLocaleString({
                      dateStyle: 'medium',
                      locale: distanceDatesCopy.locale,
                    })
                  }}
                </time>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, readonly } from 'vue'
import { DateTime, Interval } from 'luxon'
import {
  default as useDistanceDates,
  createDateTime,
  createDateTimeCollection,
  flipMaxMin,
  formatCalendarEventText,
  formatCalendarLink,
  isFuture,
  toDateTimeInterval,
  verbalizeDurationText,
} from './use-distance-dates'
import type {
  IDistanceDatesModel,
  ICreateDateTimeCollectionOptions,
} from './use-distance-dates'
import DateRange from './components/DateRange.vue'
import RelativeDateRangeForm from './components/RelativeDateRangeForm.vue'
import type { IRelativeDateRangeCalculateEmit } from './components/RelativeDateRangeForm.vue'

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
    const {
      mutate,
      distanceDates,
      duration,
      urlObj: { searchParams },
    } = useDistanceDates(location, useDistanceDatesOptions)

    const hasPregnancyInUrl = searchParams.has('pregnancy')
    const max = searchParams.get('max')
    const pregnancy = ref(hasPregnancyInUrl ? max : '')

    return {
      mutate,
      distanceDates,
      duration,
      pregnancy,
    }
  },
  computed: {
    isPregnancy(): boolean {
      return this.pregnancy !== ''
    },
    pregnancyExpectedDueDateText(): string {
      const text = this.pregnancyExpectedDueDate.toLocaleString(
        DateTime.DATE_HUGE,
      )
      return text !== null ? text : ''
    },
    pregnancyExpectedDueDate(): DateTime {
      let errorMessage = `This is not for a pregnancy calculation`
      if (this.isPregnancy === false) {
        throw new Error(errorMessage)
      }
      if (this.pregnancy !== '' && this.pregnancy !== null) {
        const date = DateTime.fromISO(this.pregnancy)
        date.setLocale(this.distanceDatesCopy.locale ?? 'en-CA')
        return date
      } else {
        errorMessage += `. The date was in an unexpected format: ${this.pregnancy}`
        throw new Error(errorMessage)
      }
    },
    distanceDatesCopy(): IDistanceDatesModel {
      return readonly(this.distanceDates)
    },
    nextEventsCount(): number {
      return this.nextEvents.length
    },
    nextEvents(): DateTime[] {
      const iterable = createDateTimeCollection(
        {
          ...this.distanceDatesCopy,
          count: 1,
          unit: 'weeks',
        } as ICreateDateTimeCollectionOptions,
        this.isPregnancy ? this.daysTillNextWeek : 0,
      )
      return Array.from(iterable)
    },
    durationText(): string {
      const interval = toDateTimeInterval(this.distanceDatesCopy)
      return verbalizeDurationText(interval)
    },
    currentWeekNumber(): number {
      if (this.isPregnancy) {
        const today = DateTime.local()
        return this.toWeekNumber(today)
      }
      return -1 // TODO finish this
    },
    daysTillNextWeek(): number {
      const weekdayToday: number = DateTime.local().weekday
      const weekdayBegin: number = DateTime.fromISO(this.distanceDatesCopy.max)
        .weekday
      const calc = weekdayBegin - weekdayToday
      return calc === 0 ? 7 : calc
    },
  },
  methods: {
    /**
     * Only useful for preparing calendar of events
     */
    toWeekNumber(date: DateTime): number {
      // Oh, yiss. That's WAY too complex. Whatev.
      // Should we want to use direction for calculation.
      // ... should make this even more complex. TechDebt++
      const leftDateValue = this.isPregnancy
        ? this.distanceDatesCopy.min
        : this.distanceDatesCopy.max
      const leftDate = DateTime.fromISO(leftDateValue).minus({
        week: 1,
      })
      // ^ For some reason have to remove a week to calculate. Gotta rewrite with tests.
      const rightDate = DateTime.fromISO(date.toISODate() as string)
      const interval = this.isPregnancy
        ? Interval.fromDateTimes(leftDate, rightDate)
        : Interval.fromDateTimes(rightDate, leftDate)
      const duration = interval.toDuration(['weeks']).toObject()
      const { weeks = 0 } = duration
      const out = Math.ceil(weeks)
      return this.isPregnancy ? out : out === 0 ? 0 : -out
    },
    onCalculate(payload: IRelativeDateRangeCalculateEmit) {
      const { locale } = this.distanceDatesCopy

      const { pregnancy = '', count, direction, unit } = payload
      this.pregnancy = pregnancy
      const inTheFuture = isFuture(direction)
      let field: 'max' | 'min' = inTheFuture ? 'max' : 'min'
      let today: IDistanceDatesModel['today'] = false

      let changeset: Partial<IDistanceDatesModel> = {
        direction,
        locale,
        today,
        unit,
      }

      let date: DateTime
      if (pregnancy !== '') {
        // Behavior when calculating pregnancy
        date = this.pregnancyExpectedDueDate
        Reflect.set(changeset, 'max', date.toISODate())
        // Only supporting when known expected date
        // Calculations should reflect (hopefully)
        // -> https://www.babycenter.com/pregnancy-due-date-calculator
        const minDate = date.minus({ weeks: 38 })
        Reflect.set(changeset, 'min', minDate.toISODate())
      } else {
        // Default behavior
        date = createDateTime(locale, { count, unit, direction })
        Reflect.set(changeset, field, date.toISODate())
        Reflect.set(changeset, flipMaxMin(field), DateTime.local().toISODate())
        Reflect.set(changeset, 'today', inTheFuture ? 'min' : 'max')
      }
      this.mutate(changeset)
    },
    formatCalendarLink,
    formatCalendarEventText,
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
