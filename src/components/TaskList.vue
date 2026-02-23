<template>
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>任务列表</h2>
      <button @click="refreshTasks" class="btn btn-secondary" :disabled="loading">
        {{ loading ? '刷新中...' : '刷新' }}
      </button>
    </div>
    
    <!-- 分页信息 -->
    <div v-if="pagination" style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
      <div style="color: #666; font-size: 14px;">
        共 {{ pagination.total }} 条任务，第 {{ pagination.page }} / {{ pagination.total_pages }} 页
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button 
          @click="goToPage(pagination.page - 1)" 
          class="btn btn-secondary"
          :disabled="pagination.page <= 1 || loading"
          style="padding: 6px 12px; font-size: 14px;"
        >
          上一页
        </button>
        <span style="min-width: 80px; text-align: center; font-size: 14px;">
          {{ pagination.page }} / {{ pagination.total_pages }}
        </span>
        <button 
          @click="goToPage(pagination.page + 1)" 
          class="btn btn-secondary"
          :disabled="pagination.page >= pagination.total_pages || loading"
          style="padding: 6px 12px; font-size: 14px;"
        >
          下一页
        </button>
      </div>
    </div>
    
    <div v-if="tasks.length === 0 && !loading" class="loading">
      暂无任务
    </div>
    
    <div v-else>
      <div v-for="task in tasks" :key="task.task_id" class="task-item">
        <div class="task-header">
          <div>
            <strong>{{ task.symbol }}</strong>
            <span :class="['order-type-badge', task.order_type === 'LIMIT' ? 'limit-badge' : 'market-badge']">
              {{ task.order_type === 'LIMIT' ? '限价单' : '市价单' }}
            </span>
            <span :class="['status-badge', `status-${task.status}`]">
              {{ getStatusText(task.status) }}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button
              v-if="canCancel(task.status)"
              @click="cancelTask(task.task_id)"
              class="btn btn-cancel"
              :disabled="cancellingTasks.has(task.task_id)"
            >
              {{ cancellingTasks.has(task.task_id) ? '取消中...' : '取消任务' }}
            </button>
            <div class="task-info">
              {{ formatTime(task.created_at) }}
            </div>
          </div>
        </div>
        
        <div class="task-basic-info">
          <div class="info-item">
            <span class="info-label">合约:</span>
            <span class="info-value">{{ task.symbol }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">方向:</span>
            <span class="info-value">{{ task.side === 'BUY' ? '开多（BUY）' : '开空（SELL）' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">杠杆:</span>
            <span class="info-value">{{ task.leverage }}x</span>
          </div>
          <div class="info-item">
            <span class="info-label">下单百分比:</span>
            <span class="info-value">{{ task.percent ? (task.percent * 100).toFixed(1) + '%' : '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">下单延迟:</span>
            <span class="info-value">{{ task.delay_ms }} ms</span>
          </div>
        </div>
        
        <!-- 详细计算信息 -->
        <div v-if="task.calculation_info" class="calculation-info">
          <h4 style="margin: 15px 0 10px 0; color: #333;">下单参数计算结果</h4>
          <div class="calc-detail">
            <div>可用资金（USDT）: <strong>{{ formatNumber(task.calculation_info.available_usdt) }}</strong></div>
            <div>使用比例: <strong>{{ (task.calculation_info.percent * 100).toFixed(1) }}%</strong></div>
            <div>实际保证金: <strong>{{ formatNumber(task.calculation_info.margin) }} USDT</strong></div>
            <div>杠杆倍数: <strong>{{ task.calculation_info.leverage }} x</strong></div>
            <div>当前价格: <strong>{{ formatNumber(task.calculation_info.price) }} USDT</strong></div>
            <div v-if="task.order_type === 'LIMIT' && task.calculation_info.limit_price">
              限价价格: <strong>{{ formatNumber(task.calculation_info.limit_price) }} USDT</strong>
              <span v-if="task.calculation_info.exec_price" style="color: #666; font-size: 12px; margin-left: 8px;">
                (执行时价格: {{ formatNumber(task.calculation_info.exec_price) }})
              </span>
            </div>
            <div>下单数量: <strong>{{ formatNumber(task.calculation_info.quantity) }} 张</strong></div>
          </div>
        </div>
        
        <div v-if="task.error" class="task-error">
          <strong>错误:</strong> {{ task.error }}
          <pre v-if="task.error_traceback" style="margin-top: 10px; font-size: 12px; white-space: pre-wrap;">{{ task.error_traceback }}</pre>
        </div>
        
        <div v-if="task.result" style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 4px;">
          <strong>订单结果:</strong>
          <pre style="margin-top: 5px; font-size: 12px; overflow-x: auto;">{{ JSON.stringify(task.result, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../utils/api'

export default {
  name: 'TaskList',
  data() {
    return {
      tasks: [],
      loading: false,
      refreshInterval: null,
      cancellingTasks: new Set(),
      pagination: null,
      currentPage: 1,
      perPage: 5
    }
  },
  mounted() {
    this.loadTasks()
    // 已移除自动刷新，改为手动刷新
    // 如需自动刷新，可取消下面的注释
    // this.refreshInterval = setInterval(() => {
    //   this.loadTasks()
    // }, 3000)
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  },
  methods: {
    async loadTasks() {
      try {
        const response = await api.get('/tasks', {
          params: {
            page: this.currentPage,
            per_page: this.perPage
          }
        })
        if (response.data.success) {
          this.tasks = response.data.tasks || []
          this.pagination = response.data.pagination || null
        }
      } catch (error) {
        console.error('加载任务失败:', error)
      }
    },
    goToPage(page) {
      if (page < 1 || (this.pagination && page > this.pagination.total_pages)) {
        return
      }
      this.currentPage = page
      this.loadTasks()
    },
    async refreshTasks() {
      this.loading = true
      await this.loadTasks()
      this.loading = false
    },
    getStatusText(status) {
      const statusMap = {
        'pending': '等待中',
        'loading': '加载中',
        'waiting': '等待整点',
        'executing': '执行中',
        'completed': '已完成',
        'failed': '失败',
        'cancelled': '已取消'
      }
      return statusMap[status] || status
    },
    formatTime(timeStr) {
      if (!timeStr) return ''
      // 默认在当前时间基础上整体 +8 小时显示
      const date = new Date(timeStr)
      const beijingTime = new Date(date.getTime() + 8 * 3600000)
      return beijingTime.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    },
    formatNumber(num) {
      if (num === null || num === undefined) return '-'
      // 对于大数字，使用适当的格式
      if (num >= 1000) {
        return num.toLocaleString('zh-CN', { maximumFractionDigits: 4 })
      } else {
        return num.toLocaleString('zh-CN', { maximumFractionDigits: 8 })
      }
    },
    canCancel(status) {
      // 只有未完成的任务才能取消
      return ['pending', 'loading', 'waiting', 'executing'].includes(status)
    },
    async cancelTask(taskId) {
      if (this.cancellingTasks.has(taskId)) {
        return
      }
      
      if (!confirm('确定要取消这个任务吗？')) {
        return
      }
      
      this.cancellingTasks.add(taskId)
      try {
        const response = await api.post(`/cancel_task/${taskId}`)
        if (response.data.success) {
          // 刷新任务列表
          await this.loadTasks()
        } else {
          alert(response.data.message || '取消任务失败')
        }
      } catch (error) {
        alert(error.response?.data?.message || '取消任务失败，请检查网络连接')
      } finally {
        this.cancellingTasks.delete(taskId)
      }
    }
  }
}
</script>

