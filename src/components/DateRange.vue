<template>
  <form method="GET">
    <fieldset>
      <legend>Propriétés</legend>
      <label
        for="unit"
      >
        Unité de mesure
      </label>
      <SelectDateRangeUnit
        :value="distanceDates.unit.value"
        name="unit"
        @change="onChangeSelectDateRangeUnit"
      />
      <label
        for="min"
      >
        De
      </label>
      <input
        :max="distanceDates.max.value"
        id="min"
        name="min"
        type="date"
        v-model="distanceDates.min.value"
      />
      <span class="validity"></span>
      <input
        type="radio"
        name="today"
        value="min"
        v-model="distanceDates.today.value"
        @click="distanceDatesTodayClick"
        title="Ajuster avec la date d’aujourd’hui"
      />
      <label
        for="max"
      >
        À
      </label>
      <input
        :min="distanceDates.min.value"
        id="max"
        name="max"
        type="date"
        v-model="distanceDates.max.value"
      />
      <span class="validity"></span>
      <input
        type="radio"
        name="today"
        value="max"
        v-model="distanceDates.today.value"
        @click="distanceDatesTodayClick"
        title="Ajuster avec la date d’aujourd’hui"
      />
      <br/>
      <button type="submit">Appliquer</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import SelectDateRangeUnit from './SelectDateRangeUnit.vue'
import {
  IDateRangeComponentProps,
  IDateRangeData,
  durationUnits,
  DurationUnit,
} from '../use-distance-dates.ts'

export default defineComponent<IDateRangeComponentProps, IDateRangeData, {}>({
  name: 'DateRange',
  components: {
    SelectDateRangeUnit,
  },
  props: {
    distanceDates: {
      required: true,
    },
  },
  data() {
    return {
      durationUnits,
    }
  },
  methods: {
    onChangeSelectDateRangeUnit({value}) {
      this.distanceDates.unit.value = value
    },
    distanceDatesTodayClick(event) {
      // If clicking on a radio button that's already
      // clicked, unset it.
      const today = this.distanceDates.today.value
      const { target = {} } = event
      const { value = '' } = target
      if (today === value) {
        this.distanceDates.today.value = false
      }
    }
  }
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
