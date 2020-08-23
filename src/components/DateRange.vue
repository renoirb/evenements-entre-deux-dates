<template>
  <div class="component-root">
    <dl>
      <dt>Durée</dt>
      <dd>
        {{ duration }}
        <span>{{ distanceDates.unit.value }}</span>
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
        <select
          v-model="distanceDates.unit.value"
          name="unit"
          id="durationUnit"
        >
          <option
            v-for="(item, index) of durationUnits"
            :key="index"
            :value="item"
            :selected="item === distanceDates.unit.value"
          >
            {{ item }}
          </option>
        </select>
      </fieldset>
      <fieldset>
        <legend>Dates</legend>
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
        />
      </fieldset>
      <button type="submit">Appliquer</button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import {
  IDateRangeComponentProps,
  IDateRangeData,
  durationUnits,
  DurationUnit,
  directions,
} from '../use-distance-dates.ts'

export default defineComponent<IDateRangeComponentProps, IDateRangeData, {}>({
  name: 'DateRange',
  props: {
    distanceDates: {
      required: true,
    },
    duration: {
      required: true,
      default: 0,
    },
  },
  data() {
    return {
      directions,
      durationUnits,
    }
  },
  methods: {
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
