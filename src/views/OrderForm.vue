<template>
  <div class="page-container">
    <OrderForm ref="orderFormRef" @task-submitted="handleTaskSubmitted" />
    <!-- 延迟加载 FundingCharts，避免阻塞页面 -->
    <FundingCharts v-if="showFundingCharts" mode="top" @select-symbol="handleSelectSymbol" />
    <TaskList ref="taskListRef" />
  </div>
</template>

<script>
import { ref, onBeforeUnmount } from 'vue'
import { requestCancelManager } from '../utils/requestCancel'
import OrderForm from '../components/OrderForm.vue'
import TaskList from '../components/TaskList.vue'
import FundingCharts from '../components/FundingCharts.vue'

export default {
  name: 'OrderFormPage',
  components: {
    OrderForm,
    TaskList,
    FundingCharts
  },
  setup() {
    const orderFormRef = ref(null)
    const taskListRef = ref(null)
    const showFundingCharts = ref(false)

    // 延迟加载 FundingCharts，避免阻塞页面渲染
    setTimeout(() => {
      showFundingCharts.value = true
    }, 300)

    const handleTaskSubmitted = (taskId) => {
      if (taskListRef.value) {
        setTimeout(() => {
          taskListRef.value.refreshTasks()
        }, 1000)
      }
    }

    const handleSelectSymbol = (symbol) => {
      if (orderFormRef.value && orderFormRef.value.selectSymbol) {
        orderFormRef.value.selectSymbol(symbol)
      }
    }

    // 组件卸载时取消所有请求
    onBeforeUnmount(() => {
      requestCancelManager.cancelAll()
    })

    return {
      orderFormRef,
      taskListRef,
      showFundingCharts,
      handleTaskSubmitted,
      handleSelectSymbol
    }
  }
}
</script>

<style scoped>
.page-container {
  padding: 0;
}

.loading-placeholder {
  padding: 40px;
  text-align: center;
  color: #999;
}
</style>
