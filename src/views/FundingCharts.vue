<template>
  <div class="page-container">
    <FundingCharts mode="compare" />
  </div>
</template>

<script>
import FundingCharts from '../components/FundingCharts.vue'

export default {
  name: 'FundingChartsPage',
  components: {
    FundingCharts
  }
}
</script>

<style scoped>
.page-container {
  padding: 0;
}
</style>
