<template>
  <form @submit.prevent="emit">
    <fieldset>
      <legend>Faire un nouveau calcul</legend>
      <input
        type="number"
        name="relativeCount"
        v-model.number="form.relativeCount"
        min="0"
        class="field"
      />
      <SelectDateRangeUnit
        :value="form.relativeUnit"
        name="relativeUnit"
        @change="onChangeSelectDateRangeUnit"
        class="field"
      />
      <select
        name="relativeDirection"
        v-model="form.relativeDirection"
        class="field"
      >
        <option
          v-for="(item, index) of directionUnits"
          :key="index"
          :value="item"
          :selected="item === form.relativeDirection"
        >
          {{ item === 'FUTURE' ? 'Dans le futur' : 'passé' }}
        </option>
      </select>
      <button type="submit">Calculer</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'
import SelectDateRangeUnit from './SelectDateRangeUnit.vue'
import {
  directionUnits,
  DurationUnit,
  DateRangeDirection,
} from '../use-distance-dates.ts'

export default defineComponent({
  name: 'RelativeDateRangeForm',
  components: {
    SelectDateRangeUnit,
  },
  setup() {
    const form = reactive({
      relativeCount: 0,
      relativeDirection: 'FUTURE',
      relativeUnit: 'weeks',
    })
    return {
      form,
    }
  },
  data() {
    return {
      directionUnits,
    }
  },
  methods: {
    onChangeSelectDateRangeUnit({value}) {
      this.form.relativeUnit = value
    },
    emit() {
      const {
        relativeCount,
        relativeDirection,
        relativeUnit
      } = this.form
      this.$emit('calculate', {
        count: relativeCount,
        direction: relativeDirection,
        unit: relativeUnit,
      })
    }
  }
})
</script>


<style scoped>
.field + .field {
  margin: 0 10px;
}
</style>
