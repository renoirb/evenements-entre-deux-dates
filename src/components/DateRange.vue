<template>
  <form method="GET" data-component-name="DateRange">
    <fieldset>
      <legend>Propriétés</legend>
      <label for="locale"> Locale </label>
      <select v-model="distanceDates.locale.value" name="locale">
        <option
          :key="index"
          :selected="locale === distanceDates.locale.value"
          :value="locale"
          v-for="([locale, label], index) of localesUnits"
        >
          {{ label }}
        </option>
      </select>
    </fieldset>
    <fieldset>
      <label for="pregnancy">Pré-natalité?</label>
      <input
        @click="(e) => e.preventDefault()"
        name="pregnancy"
        type="checkbox"
        v-model="isPregnancy"
        value=""
      />
      <label for="min"> De </label>
      <input
        @click="distancesDatesMaxInputClick"
        :max="distanceDates.max.value"
        name="min"
        type="date"
        v-model="distanceDates.min.value"
      />
      <span class="validity"></span>
      <input
        @click="distanceDatesTodayClick"
        name="today"
        title="Ajuster avec la date d’aujourd’hui"
        type="radio"
        v-if="!isPregnancy"
        v-model="distanceDates.today.value"
        value="min"
      />
      <label for="max"> À </label>
      <input
        @click="distancesDatesMaxInputClick"
        :min="distanceDates.min.value"
        name="max"
        type="date"
        v-model="distanceDates.max.value"
      />
      <span class="validity"></span>
      <input
        @click="distanceDatesTodayClick"
        name="today"
        title="Ajuster avec la date d’aujourd’hui"
        type="radio"
        v-if="!isPregnancy"
        v-model="distanceDates.today.value"
        value="max"
      />
    </fieldset>
    <button type="submit">Appliquer</button>
    <button type="reset" @click="resetClick">Reset</button>
  </form>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { durationUnits, localesUnits } from '../use-distance-dates'
import type { IDateRange } from '../use-distance-dates'

export default defineComponent({
  name: 'DateRange',
  props: {
    distanceDates: {
      required: true,
      // type: Object as PropType<IDistanceDatesModel>,
      // validator: (v: IDistanceDatesModel) => false,
    },
    pregnancy: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      durationUnits,
      localesUnits,
    }
  },
  computed: {
    isPregnancy() {
      return this.pregnancy !== ''
    },
  },
  methods: {
    resetClick() {
      location.search = ''
    },
    distancesDatesMaxInputClick(event: HTMLElementEventMap['click']) {
      if (this.isPregnancy) {
        event.preventDefault()
        const input = event.target
        console.log('Veuillez faire un nouveau calcul', { input })
      }
    },
    distanceDatesTodayClick(event: HTMLElementEventMap['click']) {
      // If clicking on a radio button that's already
      // clicked, unset it.
      const today = this.distanceDates.today.value
      const { target = {} } = event
      const { value } = target as { value: IDateRange['today'] }
      if (today === value) {
        this.distanceDates.today.value = false
      }
    },
  },
})
</script>

<style scoped>
label {
  display: flex;
  align-items: center;
}
span::after {
  padding-left: 5px;
}
input:invalid + span::after {
  content: '✖';
}
input:valid + span::after {
  content: '✓';
}
</style>
