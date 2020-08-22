<template>
  <div class="component-root">
    <dl>
      <dt>Durée</dt>
      <dd>
        {{ duration }}
        <span>{{ unit }}</span>
      </dd>
    </dl>
    <!--
    <form @submit.prevent="calculateBasedOn($event)">
      <fieldset>
        <legend>Calculate based on</legend>
        <label
          for="direction"
        >
          Direction
        </label>
        <select
          id="direction"
          v-model="calculateBasedOnForm.direction"
        >
          <option
            v-for="(dir, index) of directions"
            :key="index"
            :value="dir"
            :selected="dir === calculateBasedOnForm.direction"
          >
            {{ dir }}
          </option>
        </select>
      </fieldset>
      <button type="submit">Calculate</button>
    </form>
    -->
    <form method="GET">
      <fieldset>
        <label
          for="durationUnit"
        >
          Unité de mesure
        </label>
        <select v-model="unit" name="unit" id="durationUnit">
          <option
            v-for="(durationUnit, index) of durationUnits"
            :key="index"
            :value="durationUnit"
            :selected="durationUnit === unit"
          >
            {{ durationUnit }}
          </option>
        </select>
      </fieldset>
      <hr />
      <fieldset>
        <legend>Dates</legend>
        <label
          for="min"
          class="block text-gray-700 text-sm font-bold mb-2"
        >
          De
        </label>
        <input
          type="date"
          v-model="min"
          :max="max"
          name="min"
          id="min"
        />
        <span class="validity"></span>
        <label
          for="max"
          class="block text-gray-700 text-sm font-bold mb-2"
        >
          À
        </label>
        <input
          type="date"
          v-model="max"
          :min="min"
          name="max"
          id="max"
        />
        <span class="validity"></span>
      </fieldset>
      <button type="submit">Calculer</button>
    </form>
  </div>
</template>

<script lang="ts">
import { onMounted, render } from 'vue'
import {
  default as useDistanceDates,
  directions,
  distanceDatesModelFields,
  durationUnits,
  IDistanceDatesModel,
  resetCalculateBasedForm,
} from '../use-distance-dates.ts'

export default {
  name: 'DateRange',
  setup() {
    const {
      distanceDates,
      changeDateRange,
      duration,
    } = useDistanceDates(
    location,
    {
      // logger: console
    })

    const {
      direction,
      max,
      min,
      unit,
    } = distanceDates
    return {
      direction,
      duration,
      max,
      min,
      unit,
    }
  },
  data() {
    return {
      count: 0,
      durationUnits,
      directions,
    }
  }
}
</script>

<style scoped>
.component-root {
  background-color: #FFF;
  width: 900px;
  margin: 50px auto;
  padding: 40px;
  border: 1px solid #777;
}
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
