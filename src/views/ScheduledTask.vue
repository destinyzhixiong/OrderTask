<template>
  <div class="page-container">
    <ScheduledTask />
  </div>
</template>

<script>
import ScheduledTask from '../components/ScheduledTask.vue'

export default {
  name: 'ScheduledTaskPage',
  components: {
    ScheduledTask
  }
}
</script>

<style scoped>
.page-container {
  padding: 0;
}
</style>
