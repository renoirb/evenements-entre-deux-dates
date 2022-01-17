<template>
  <form @submit.prevent="submit" data-component-name="RelativeDateRangeForm">
    <label for="pregnancy" v-if="forPregnancy">
      Date prévue selon l’échographie
    </label>
    <input
      type="date"
      name="pregnancy"
      id="pregnancy"
      class="field"
      v-if="forPregnancy"
      v-model="whenPregnancyExpectedDueDate"
    />
    <input
      type="number"
      name="count"
      min="0"
      class="field"
      v-if="!forPregnancy"
      v-model.number="form.count"
    />
    <input type="hidden" v-if="forPregnancy" name="count" :value="form.count" />
    <SelectDateRangeUnit
      name="unit"
      @change="changeUnit"
      class="field"
      :value="form.unit"
      v-if="!forPregnancy"
    />
    <input type="hidden" v-if="forPregnancy" name="unit" :value="form.unit" />
    <select
      name="direction"
      class="field"
      v-if="!forPregnancy"
      v-model="form.direction"
    >
      <option
        v-for="(item, index) of directionUnits"
        :key="index"
        :value="item"
        :selected="item === form.direction"
      >
        {{ item === 'FUTURE' ? 'Dans le futur' : 'Dans le passé' }}
      </option>
    </select>
    <input
      type="hidden"
      v-if="forPregnancy"
      name="direction"
      :value="form.direction"
    />
    <button type="submit">Calculer</button>
  </form>
</template>

<script lang="ts">
import { defineComponent, reactive, toRef } from 'vue'
import SelectDateRangeUnit from './SelectDateRangeUnit.vue'
import {
  directionUnits,
  createDateTime,
  validateRelativeDateRangePayload,
  isDateTimeString,
} from '../use-distance-dates'
import type { IRelativeDateRangeCalculate } from '../use-distance-dates'

export interface IRelativeDateRangeCalculateEmit
  extends IRelativeDateRangeCalculate {
  pregnancy: string | ''
}

export default defineComponent({
  name: 'RelativeDateRangeForm',
  components: {
    SelectDateRangeUnit,
  },
  setup(props) {
    const forPregnancy = toRef(props, 'forPregnancy')
    const form = reactive({
      count: forPregnancy.value === true ? /* not really used. */ 40 : 0, // Gosh! I wish I made this testable!
      direction: 'FUTURE',
      unit: forPregnancy.value === true ? 'weeks' : 'months',
    } as IRelativeDateRangeCalculate)
    return {
      form,
      forPregnancy,
    }
  },
  emits: {
    calculate: (payload: IRelativeDateRangeCalculateEmit) => {
      const { pregnancy } = payload
      if (pregnancy !== '' && isDateTimeString(pregnancy) === false) {
        const message = `The pregnancy property can only be an empty string or a date, we got: ${pregnancy}`
        throw new Error(message)
      }
      return validateRelativeDateRangePayload<IRelativeDateRangeCalculateEmit>(
        payload,
      )
    },
  },
  data() {
    const whenPregnancyExpectedDueDate = createDateTime('en-CA', {
      count: 0,
    }).toFormat('yyyy-MM-dd')
    return {
      directionUnits,
      whenPregnancyExpectedDueDate,
    }
  },
  props: {
    forPregnancy: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    changeUnit({ value }) {
      this.form.unit = value
    },
    submit() {
      const pregnancy = this.forPregnancy
        ? this.whenPregnancyExpectedDueDate
        : ''
      const emitting: IRelativeDateRangeCalculateEmit = {
        count: this.form.count,
        direction: this.form.direction,
        unit: this.form.unit,
        pregnancy,
      }
      this.$emit('calculate', emitting)
    },
  },
})
</script>

<style scoped>
.field + .field {
  margin: 0 10px;
}
</style>
