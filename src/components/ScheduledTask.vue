<template>
  <div class="scheduled-task-container">
    <!-- 任务状态和控制 -->
    <div class="task-control-section">
      <div class="status-box">
        <div class="status-item">
          <span class="status-label">运行状态：</span>
          <span :class="['status-value', isRunning ? 'status-running' : 'status-stopped']">
            {{ isRunning ? '运行中' : '已停止' }}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">符合条件的币种：</span>
          <span class="status-value">{{ qualifiedSymbols.length }} 个</span>
        </div>
      </div>
      
      <div class="control-buttons">
        <button 
          v-if="!isRunning" 
          @click="startTask" 
          class="btn btn-primary"
          :disabled="loading"
        >
          启动计划任务
        </button>
        <button 
          v-else 
          @click="stopTask" 
          class="btn btn-danger"
          :disabled="loading"
        >
          停止计划任务
        </button>
        <button 
          @click="refreshQualifiedSymbols" 
          class="btn btn-secondary"
          :disabled="loading"
        >
          刷新币种列表
        </button>
      </div>
    </div>
    
    <!-- 左右布局容器 -->
    <div class="main-layout">
      <!-- 左侧：配置区域 -->
      <div class="left-panel">
        <!-- 配置表单 -->
        <div class="config-section">
          <div class="section-header">
            <h3 class="section-title">任务配置</h3>
            <button 
              @click="saveConfig" 
              class="btn btn-primary"
              :disabled="savingConfig"
            >
              {{ savingConfig ? '保存中...' : '保存配置' }}
            </button>
          </div>
          <div class="config-form">
            <div class="form-row">
              <div class="form-group">
                <label>下单金额（USDT）</label>
                <input 
                  type="number" 
                  v-model.number="config.margin" 
                  class="form-input"
                  step="0.01"
                  min="0"
                />
              </div>
              <div class="form-group">
                <label>杠杆倍数</label>
                <input 
                  type="number" 
                  v-model.number="config.leverage" 
                  class="form-input"
                  step="1"
                  min="1"
                  max="125"
                />
              </div>
              <div class="form-group">
                <label>下单延迟（毫秒）</label>
                <input 
                  type="number" 
                  v-model.number="config.delay_ms" 
                  class="form-input"
                  step="1"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>动态止损阈值</label>
                <input 
                  type="number" 
                  v-model.number="config.dynamic_stop_threshold" 
                  class="form-input"
                  step="0.001"
                  min="0"
                />
                <small style="color: #666; display: block; margin-top: 4px;">保留字段（暂未使用）</small>
              </div>
            </div>
            
            <!-- 止盈止损配置 -->
            <div class="config-subsection">
              <h4 class="subsection-title">实时止盈配置</h4>
              <div class="form-row">
                <div class="form-group">
                  <label>回报率阈值（%）</label>
                  <input 
                    type="number" 
                    v-model.number="config.real_time_tp_roe" 
                    class="form-input"
                    step="0.1"
                    min="0"
                  />
                  <small style="color: #666; display: block; margin-top: 4px;">回报率 > 此值时立即止盈</small>
                </div>
              </div>
            </div>
            
            <div class="config-subsection">
              <h4 class="subsection-title">3分钟判断配置</h4>
              <div class="form-row">
                <div class="form-group">
                  <label>盈利回报率阈值（%）</label>
                  <input 
                    type="number" 
                    v-model.number="config.three_min_profit_roe" 
                    class="form-input"
                    step="0.1"
                    min="0"
                  />
                  <small style="color: #666; display: block; margin-top: 4px;">回报率 > 此值时立即止盈</small>
                </div>
                <div class="form-group">
                  <label>亏损止亏阈值（%）</label>
                  <input 
                    type="number" 
                    v-model.number="config.three_min_loss_sl_roe" 
                    class="form-input"
                    step="0.1"
                    min="0"
                  />
                  <small style="color: #666; display: block; margin-top: 4px;">亏损回报率 ≤ 此值时立即止亏</small>
                </div>
                <div class="form-group">
                  <label>亏损挂单阈值（%）</label>
                  <input 
                    type="number" 
                    v-model.number="config.three_min_loss_limit_roe" 
                    class="form-input"
                    step="0.1"
                    min="0"
                  />
                  <small style="color: #666; display: block; margin-top: 4px;">亏损回报率 > 此值时，挂限价单平仓，限价单价格 = 开仓价（不亏损平仓）</small>
                </div>
              </div>
            </div>
            
            <div class="config-subsection">
              <h4 class="subsection-title">动态止损配置</h4>
              <div class="form-row">
                <div class="form-group">
                  <label>跟踪启动比例</label>
                  <input 
                    type="number" 
                    v-model.number="config.tracking_start_ratio" 
                    class="form-input"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                  <small style="color: #666; display: block; margin-top: 4px;">价格达到开仓价的此比例时开始跟踪（如0.99表示99%）</small>
                </div>
                <div class="form-group">
                  <label>强制平仓比例</label>
                  <input 
                    type="number" 
                    v-model.number="config.immediate_stop_ratio" 
                    class="form-input"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                  <small style="color: #666; display: block; margin-top: 4px;">价格达到开仓价的此比例时立即平仓（如0.95表示95%）</small>
                </div>
              </div>
            </div>
            
            <div class="config-subsection">
              <h4 class="subsection-title">币种筛选配置</h4>
              <div class="form-row">
                <div class="form-group">
                  <label>15m成交额最小值（USDT）</label>
                  <input 
                    type="number" 
                    v-model.number="config.min_volume_15m_usdt" 
                    class="form-input"
                    step="10000"
                    min="0"
                  />
                  <small style="color: #666; display: block; margin-top: 4px;">符合条件的币种需要满足15m成交额(USDT) >= 此值（默认100万）</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧：数据展示区域 -->
      <div class="right-panel">
        <!-- 符合条件的币种列表 -->
        <div class="symbols-section">
          <h3 class="section-title">符合条件的币种（24h或15m是跌，概率≥50%，按15m成交额排序）</h3>
          <div v-if="loadingSymbols" class="loading">加载中...</div>
          <div v-else-if="qualifiedSymbols.length === 0" class="empty">暂无符合条件的币种</div>
          <table v-else class="symbols-table">
            <thead>
              <tr>
                <th>币种</th>
                <th>24h趋势</th>
                <th>24h概率</th>
                <th>15m趋势</th>
                <th>15m概率</th>
                <th>15m成交额(USDT)</th>
                <th>下一个时间窗口</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="symbol in qualifiedSymbols" :key="symbol.symbol">
                <td>{{ symbol.symbol }}</td>
                <td :class="['trend', symbol.trend_24h === '跌' ? 'trend-down' : 'trend-up']">
                  {{ symbol.trend_24h }}
                </td>
                <td>{{ formatProb(symbol.prob_24h) }}</td>
                <td :class="['trend', symbol.trend_15m === '跌' ? 'trend-down' : 'trend-up']">
                  {{ symbol.trend_15m }}
                </td>
                <td>{{ formatProb(symbol.prob_15m) }}</td>
                <td>{{ formatNumber(symbol.volume_15m_usdt) }}</td>
                <td>{{ symbol.next_window_label }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 交易统计 -->
        <div class="stats-section">
          <h3 class="section-title">交易统计</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">总收益</div>
              <div class="stat-value positive">{{ formatCurrency(stats.total_profit) }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">总亏损</div>
              <div class="stat-value negative">{{ formatCurrency(stats.total_loss) }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">净收益</div>
              <div :class="['stat-value', stats.net_profit >= 0 ? 'positive' : 'negative']">
                {{ formatCurrency(stats.net_profit) }}
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">下单次数</div>
              <div class="stat-value">{{ stats.total_trades }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">盈利次数</div>
              <div class="stat-value positive">{{ stats.win_count }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">亏损次数</div>
              <div class="stat-value negative">{{ stats.loss_count }}</div>
            </div>
          </div>
        </div>
        
        <!-- 下单记录 -->
        <div class="order-attempts-section">
          <div class="section-header">
            <h3 class="section-title">下单记录</h3>
            <button 
              @click="refreshOrderAttempts" 
              class="btn btn-secondary btn-small"
              :disabled="loadingAttempts"
            >
              {{ loadingAttempts ? '刷新中...' : '刷新' }}
            </button>
          </div>
          <div v-if="loadingAttempts" class="loading">加载中...</div>
          <div v-else-if="orderAttempts.length === 0" class="empty">暂无下单记录</div>
          <div v-else>
            <!-- 统计卡片 -->
            <div class="attempts-stats">
              <div class="stat-card">
                <div class="stat-label">预计下单</div>
                <div class="stat-value">{{ attemptsStats.planned }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">下单成功</div>
                <div class="stat-value positive">{{ attemptsStats.success }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">下单失败</div>
                <div class="stat-value negative">{{ attemptsStats.failed }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">跳过下单</div>
                <div class="stat-value" style="color: #ff9800;">{{ attemptsStats.skipped }}</div>
              </div>
            </div>
            
            <!-- 记录表格 -->
            <div class="table-container">
              <table class="attempts-table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>币种</th>
                    <th>方向</th>
                    <th>状态</th>
                    <th>计划价格</th>
                    <th>计划数量</th>
                    <th>实际价格</th>
                    <th>实际数量</th>
                    <th>原因/错误</th>
                    <th>详情</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="attempt in orderAttempts" :key="attempt.attempt_id">
                    <tr :class="getStatusClass(attempt.status)">
                      <td>{{ formatTime(attempt.created_at) }}</td>
                      <td>{{ attempt.symbol }}</td>
                      <td>{{ attempt.side }}</td>
                      <td>
                        <span :class="['status-badge', getStatusBadgeClass(attempt.status)]">
                          {{ getStatusText(attempt.status) }}
                        </span>
                      </td>
                      <td>{{ attempt.planned_price ? attempt.planned_price.toFixed(4) : '-' }}</td>
                      <td>{{ attempt.planned_quantity ? attempt.planned_quantity.toFixed(4) : '-' }}</td>
                      <td>{{ attempt.actual_price ? attempt.actual_price.toFixed(4) : '-' }}</td>
                      <td>{{ attempt.actual_quantity ? attempt.actual_quantity.toFixed(4) : '-' }}</td>
                      <td class="reason-cell">
                        <span v-if="attempt.reason" class="reason-text">{{ attempt.reason }}</span>
                        <span v-if="attempt.error_message" class="error-text" :title="attempt.error_message">
                          {{ attempt.error_message.length > 50 ? attempt.error_message.substring(0, 50) + '...' : attempt.error_message }}
                        </span>
                      </td>
                      <td>
                        <button 
                          v-if="attempt.error_message || attempt.error_traceback || attempt.debug_info"
                          @click="toggleDetail(attempt.attempt_id)"
                          class="btn-detail"
                          :class="{ 'expanded': expandedDetails.includes(attempt.attempt_id) }"
                        >
                          {{ expandedDetails.includes(attempt.attempt_id) ? '收起' : '展开' }}
                        </button>
                      </td>
                    </tr>
                    <tr v-if="expandedDetails.includes(attempt.attempt_id)" class="detail-row">
                      <td colspan="10" class="detail-cell">
                        <div class="detail-content">
                          <div v-if="attempt.error_message" class="detail-section">
                            <div class="detail-label">错误信息：</div>
                            <div class="detail-value error-text">{{ attempt.error_message }}</div>
                          </div>
                          <div v-if="attempt.error_traceback" class="detail-section">
                            <div class="detail-label">错误堆栈：</div>
                            <pre class="detail-value traceback">{{ attempt.error_traceback }}</pre>
                          </div>
                          <div v-if="attempt.debug_info" class="detail-section">
                            <div class="detail-label">调试信息：</div>
                            <pre class="detail-value debug-info">{{ formatDebugInfo(attempt.debug_info) }}</pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            
            <div class="pagination" v-if="attemptsPagination.total_pages > 1">
              <button 
                @click="loadOrderAttempts(attemptsPagination.page - 1)" 
                :disabled="attemptsPagination.page <= 1"
                class="btn btn-small"
              >
                上一页
              </button>
              <span class="page-info">
                第 {{ attemptsPagination.page }} / {{ attemptsPagination.total_pages }} 页
              </span>
              <button 
                @click="loadOrderAttempts(attemptsPagination.page + 1)" 
                :disabled="attemptsPagination.page >= attemptsPagination.total_pages"
                class="btn btn-small"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
        
        <!-- 交易记录 -->
        <div class="trades-section">
          <div class="section-header">
            <h3 class="section-title">交易记录</h3>
            <button 
              @click="syncTrades" 
              class="btn btn-secondary btn-small"
              :disabled="syncingTrades"
            >
              {{ syncingTrades ? '同步中...' : '同步交易记录' }}
            </button>
          </div>
          <div v-if="loadingTrades" class="loading">加载中...</div>
          <div v-else-if="trades.length === 0" class="empty">暂无交易记录</div>
          <div v-else>
            <table class="trades-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>币种</th>
                  <th>方向</th>
                  <th>入场价</th>
                  <th>出场价</th>
                  <th>数量</th>
                  <th>盈亏</th>
                  <th>盈亏比例</th>
                  <th>状态</th>
                  <th>同步状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="trade in trades" :key="trade.task_id">
                  <td>{{ formatTime(trade.created_at) }}</td>
                  <td>{{ trade.symbol }}</td>
                  <td>{{ trade.side }}</td>
                  <td>{{ trade.entry_price ? trade.entry_price.toFixed(4) : '-' }}</td>
                  <td>{{ trade.exit_price ? trade.exit_price.toFixed(4) : '-' }}</td>
                  <td>{{ trade.quantity ? trade.quantity.toFixed(4) : '-' }}</td>
                  <td :class="trade.profit_loss >= 0 ? 'positive' : 'negative'">
                    {{ trade.profit_loss ? formatCurrency(trade.profit_loss) : '-' }}
                  </td>
                  <td :class="trade.profit_loss_pct >= 0 ? 'positive' : 'negative'">
                    {{ trade.profit_loss_pct ? (trade.profit_loss_pct * 100).toFixed(2) + '%' : '-' }}
                  </td>
                  <td>
                    <span :class="['status-badge', `status-${trade.status}`]">
                      {{ getTradeStatusText(trade.status) }}
                    </span>
                  </td>
                  <td>
                    <span v-if="trade.status === 'closed' || trade.status === 'completed'" 
                          :class="['sync-badge', trade.sync_status === 0 ? 'synced' : 'unsynced']">
                      {{ trade.sync_status === 0 ? '已同步' : '未同步' }}
                    </span>
                    <span v-else>-</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="pagination" v-if="pagination.total_pages > 1">
              <button 
                @click="loadTrades(pagination.page - 1)" 
                :disabled="pagination.page <= 1"
                class="btn btn-small"
              >
                上一页
              </button>
              <span class="page-info">
                第 {{ pagination.page }} / {{ pagination.total_pages }} 页
              </span>
              <button 
                @click="loadTrades(pagination.page + 1)" 
                :disabled="pagination.page >= pagination.total_pages"
                class="btn btn-small"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '../utils/api'
import { requestCancelManager } from '../utils/requestCancel'

export default {
  name: 'ScheduledTask',
  setup() {
    const loading = ref(false)
    const loadingSymbols = ref(false)
    const loadingTrades = ref(false)
    const syncingTrades = ref(false)
    const loadingAttempts = ref(false)
    const savingConfig = ref(false)
    const isRunning = ref(false)
    const qualifiedSymbols = ref([])
    const trades = ref([])
    const pagination = ref({ page: 1, per_page: 5, total: 0, total_pages: 0 })
    const orderAttempts = ref([])
    const attemptsPagination = ref({ page: 1, per_page: 5, total: 0, total_pages: 0 })
    const attemptsStats = ref({
      planned: 0,
      success: 0,
      failed: 0,
      skipped: 0
    })
    const expandedDetails = ref([])
    const stats = ref({
      total_profit: 0,
      total_loss: 0,
      total_trades: 0,
      win_count: 0,
      loss_count: 0,
      net_profit: 0
    })
    
    const config = ref({
      margin: 100,
      leverage: 20,
      delay_ms: -100,
      dynamic_stop_threshold: 0.02,
      real_time_tp_roe: 15.0,
      three_min_profit_roe: 0.0,
      three_min_loss_sl_roe: 10.0,
      three_min_loss_limit_roe: 15.0,
      tracking_start_ratio: 0.99,
      immediate_stop_ratio: 0.95,
      min_volume_15m_usdt: 1000000.0
    })
    
    let statusInterval = null
    
    const loadConfig = async () => {
      try {
        const response = await api.get('/scheduled_task/config')
        console.log('[DEBUG] 加载配置响应:', response.data)
        if (response.data.success) {
          if (response.data.config) {
            console.log('[DEBUG] 加载到的配置:', response.data.config)
            // 直接更新配置字段，避免覆盖问题
            config.value.margin = response.data.config.margin ?? config.value.margin
            config.value.leverage = response.data.config.leverage ?? config.value.leverage
            config.value.delay_ms = response.data.config.delay_ms ?? config.value.delay_ms
            config.value.dynamic_stop_threshold = response.data.config.dynamic_stop_threshold ?? config.value.dynamic_stop_threshold
            config.value.real_time_tp_roe = response.data.config.real_time_tp_roe ?? config.value.real_time_tp_roe
            config.value.three_min_profit_roe = response.data.config.three_min_profit_roe ?? config.value.three_min_profit_roe
            config.value.three_min_loss_sl_roe = response.data.config.three_min_loss_sl_roe ?? config.value.three_min_loss_sl_roe
            config.value.three_min_loss_limit_roe = response.data.config.three_min_loss_limit_roe ?? config.value.three_min_loss_limit_roe
            config.value.tracking_start_ratio = response.data.config.tracking_start_ratio ?? config.value.tracking_start_ratio
            config.value.immediate_stop_ratio = response.data.config.immediate_stop_ratio ?? config.value.immediate_stop_ratio
            config.value.min_volume_15m_usdt = response.data.config.min_volume_15m_usdt ?? config.value.min_volume_15m_usdt
            console.log('[DEBUG] 更新后的配置:', config.value)
          }
        }
      } catch (error) {
        console.error('加载配置失败:', error)
      }
    }
    
    const saveConfig = async () => {
      savingConfig.value = true
      try {
        // 保存当前配置的副本，用于调试
        const configToSave = { ...config.value }
        console.log('[DEBUG] 准备保存配置:', configToSave)
        
        const response = await api.post('/scheduled_task/config', configToSave)
        console.log('[DEBUG] 保存配置响应:', response.data)
        
        if (response.data.success) {
          // 保存成功后，使用后端返回的配置数据更新前端（确保数据同步）
          if (response.data.config) {
            console.log('[DEBUG] 使用后端返回的配置更新前端:', response.data.config)
            // 直接替换配置对象，确保所有字段都更新
            config.value.margin = response.data.config.margin
            config.value.leverage = response.data.config.leverage
            config.value.delay_ms = response.data.config.delay_ms
            config.value.dynamic_stop_threshold = response.data.config.dynamic_stop_threshold
            config.value.real_time_tp_roe = response.data.config.real_time_tp_roe
            config.value.three_min_profit_roe = response.data.config.three_min_profit_roe
            config.value.three_min_loss_sl_roe = response.data.config.three_min_loss_sl_roe
            config.value.three_min_loss_limit_roe = response.data.config.three_min_loss_limit_roe
            config.value.tracking_start_ratio = response.data.config.tracking_start_ratio
            config.value.immediate_stop_ratio = response.data.config.immediate_stop_ratio
            // 保留is_running字段（如果存在）
            if (response.data.config.is_running !== undefined) {
              // is_running 不在config中，不需要更新
            }
            console.log('[DEBUG] 更新后的配置:', config.value)
          } else {
            console.warn('[DEBUG] 后端没有返回配置，重新加载')
            // 如果后端没有返回配置，重新加载
            await loadConfig()
          }
          // 显示成功提示（使用简单的提示，不弹窗）
          const messageEl = document.createElement('div')
          messageEl.textContent = '配置已保存'
          messageEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 20px; border-radius: 4px; z-index: 10000; box-shadow: 0 2px 8px rgba(0,0,0,0.2);'
          document.body.appendChild(messageEl)
          setTimeout(() => {
            messageEl.remove()
          }, 2000)
        } else {
          alert('保存配置失败: ' + response.data.message)
        }
      } catch (error) {
        console.error('保存配置失败:', error)
        alert('保存配置失败')
      } finally {
        savingConfig.value = false
      }
    }
    
    const checkStatus = async () => {
      try {
        const response = await api.get('/scheduled_task/status')
        if (response.data.success) {
          isRunning.value = response.data.is_running
        }
      } catch (error) {
        console.error('检查状态失败:', error)
      }
    }
    
    const refreshQualifiedSymbols = async () => {
      loadingSymbols.value = true
      try {
        const response = await api.get('/scheduled_task/qualified_symbols', {
          params: { 
            min_probability: 0.5, 
            max_count: 3,
            min_volume_15m_usdt: config.value.min_volume_15m_usdt || 1000000.0
          }
        })
        if (response.data.success) {
          qualifiedSymbols.value = response.data.symbols || []
        } else {
          alert('获取符合条件的币种失败: ' + response.data.message)
        }
      } catch (error) {
        console.error('获取符合条件的币种失败:', error)
        alert('获取符合条件的币种失败')
      } finally {
        loadingSymbols.value = false
      }
    }
    
    const startTask = async () => {
      if (!confirm('确定要启动计划任务吗？')) {
        return
      }
      
      loading.value = true
      try {
        const response = await api.post('/scheduled_task/start')
        if (response.data.success) {
          alert('计划任务已启动')
          isRunning.value = true
          refreshQualifiedSymbols()
        } else {
          alert('启动失败: ' + response.data.message)
        }
      } catch (error) {
        console.error('启动计划任务失败:', error)
        alert('启动计划任务失败')
      } finally {
        loading.value = false
      }
    }
    
    const stopTask = async () => {
      if (!confirm('确定要停止计划任务吗？')) {
        return
      }
      
      loading.value = true
      try {
        const response = await api.post('/scheduled_task/stop')
        if (response.data.success) {
          alert('计划任务已停止')
          isRunning.value = false
        } else {
          alert('停止失败: ' + response.data.message)
        }
      } catch (error) {
        console.error('停止计划任务失败:', error)
        alert('停止计划任务失败')
      } finally {
        loading.value = false
      }
    }
    
    const loadTrades = async (page = 1) => {
      loadingTrades.value = true
      try {
        const response = await api.get('/scheduled_task/trades', {
          params: { page, per_page: 5 }
        })
        if (response.data.success) {
          trades.value = response.data.trades || []
          pagination.value = response.data.pagination || pagination.value
        }
      } catch (error) {
        console.error('加载交易记录失败:', error)
      } finally {
        loadingTrades.value = false
      }
    }
    
    const syncTrades = async () => {
      if (!confirm('确定要同步交易记录吗？这将与币安仓位历史数据进行对比并更新盈亏数据。')) {
        return
      }
      
      syncingTrades.value = true
      try {
        const response = await api.post('/scheduled_task/sync_trades', {
          sync_only: true  // 只同步未同步的记录
        })
        if (response.data.success) {
          alert(`同步完成：${response.data.message}`)
          // 刷新交易记录
          loadTrades(pagination.value?.page || 1)
        } else {
          alert('同步失败: ' + response.data.message)
        }
      } catch (error) {
        console.error('同步交易记录失败:', error)
        alert('同步交易记录失败')
      } finally {
        syncingTrades.value = false
      }
    }
    
    const loadStats = async () => {
      try {
        const response = await api.get('/scheduled_task/stats')
        if (response.data.success) {
          stats.value = response.data.stats || stats.value
        }
      } catch (error) {
        console.error('加载统计信息失败:', error)
      }
    }
    
    const formatProb = (prob) => {
      if (prob === null || prob === undefined) return '-'
      return (prob * 100).toFixed(1) + '%'
    }
    
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '0.00'
      return value.toFixed(2)
    }
    
    const formatNumber = (value) => {
      if (value === null || value === undefined) return '-'
      return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
    }
    
    const getTradeStatusText = (status) => {
      const statusMap = {
        'pending': '等待中',
        'open': '持仓中',
        'closed': '已平仓',
        'completed': '已完成',
        'cancelled': '已取消'
      }
      return statusMap[status] || status
    }
    
    const formatTime = (timeStr) => {
      if (!timeStr) return '-'
      
      // 判断时间字符串格式
      // 如果包含微秒（.xxxxxx），说明是target_time格式，已经是北京时间，不需要再加8小时
      // 如果是CURRENT_TIMESTAMP格式（通常是 'YYYY-MM-DD HH:MM:SS'），可能是UTC时间，需要加8小时
      const hasMicroseconds = /\.\d{6}/.test(timeStr)
      
      let date
      if (hasMicroseconds) {
        // target_time格式：已经是北京时间，直接解析，不加8小时
        // 移除微秒部分，因为JavaScript的Date不支持微秒
        const timeStrWithoutMicroseconds = timeStr.replace(/\.\d{6}/, '')
        date = new Date(timeStrWithoutMicroseconds.replace(' ', 'T') + '+08:00')
      } else {
        // CURRENT_TIMESTAMP格式：可能是UTC时间，需要加8小时
        date = new Date(timeStr)
        // 如果解析后的时间看起来是UTC时间（没有时区信息），则加8小时
        // 检查：如果时间字符串不包含时区信息（如+08:00或Z），则假设是UTC时间
        if (!timeStr.includes('+') && !timeStr.includes('Z') && !timeStr.includes('T')) {
          date = new Date(date.getTime() + 8 * 3600000)
        }
      }
      
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    }
    
    const loadOrderAttempts = async (page = 1) => {
      loadingAttempts.value = true
      try {
        const response = await api.get('/scheduled_task/order_attempts', {
          params: { page, per_page: 5 }
        })
        if (response.data.success) {
          orderAttempts.value = response.data.attempts || []
          attemptsPagination.value = response.data.pagination || attemptsPagination.value
          
          // 使用后端返回的统计信息（基于所有记录，而不是当前页）
          if (response.data.stats) {
            attemptsStats.value = response.data.stats
          } else {
            // 如果没有统计信息，使用默认值
            attemptsStats.value = { planned: 0, success: 0, failed: 0, skipped: 0 }
          }
        }
      } catch (error) {
        console.error('加载下单记录失败:', error)
      } finally {
        loadingAttempts.value = false
      }
    }
    
    const refreshOrderAttempts = () => {
      loadOrderAttempts(attemptsPagination.value.page)
    }
    
    const getStatusText = (status) => {
      const statusMap = {
        'planned': '预计下单',
        'success': '下单成功',
        'failed': '下单失败',
        'skipped': '跳过下单'
      }
      return statusMap[status] || status
    }
    
    const getStatusClass = (status) => {
      return `status-${status}`
    }
    
    const getStatusBadgeClass = (status) => {
      const classMap = {
        'planned': 'badge-planned',
        'success': 'badge-success',
        'failed': 'badge-failed',
        'skipped': 'badge-skipped'
      }
      return classMap[status] || ''
    }
    
    const toggleDetail = (attemptId) => {
      const index = expandedDetails.value.indexOf(attemptId)
      if (index > -1) {
        expandedDetails.value.splice(index, 1)
      } else {
        expandedDetails.value.push(attemptId)
      }
    }
    
    const formatDebugInfo = (debugInfo) => {
      if (!debugInfo) return ''
      if (typeof debugInfo === 'string') return debugInfo
      return JSON.stringify(debugInfo, null, 2)
    }
    
    onMounted(async () => {
      // 异步并行加载，不阻塞页面渲染
      Promise.all([
        loadConfig(),
        checkStatus(),
        refreshQualifiedSymbols(),
        loadTrades(),
        loadStats(),
        loadOrderAttempts()
      ]).catch(error => {
        if (error.name !== 'CanceledError' && !error.message?.includes('canceled')) {
          console.error('加载数据失败:', error)
        }
      })
      
      // 已移除自动刷新，改为手动刷新
      // 如需自动刷新，可取消下面的注释
      // statusInterval = setInterval(() => {
      //   checkStatus()
      //   loadStats()
      //   loadOrderAttempts(attemptsPagination.value.page) // 刷新当前页
      // }, 30000)
    })
    
    onUnmounted(() => {
      // 取消所有正在进行的请求
      requestCancelManager.cancelAll()
      if (statusInterval) {
        clearInterval(statusInterval)
      }
    })
    
    return {
      loading,
      loadingSymbols,
      loadingTrades,
      syncingTrades,
      syncTrades,
      loadingAttempts,
      savingConfig,
      isRunning,
      qualifiedSymbols,
      trades,
      pagination,
      orderAttempts,
      attemptsPagination,
      attemptsStats,
      stats,
      config,
      loadConfig,
      saveConfig,
      checkStatus,
      refreshQualifiedSymbols,
      startTask,
      stopTask,
      loadTrades,
      loadStats,
      loadOrderAttempts,
      refreshOrderAttempts,
      getStatusText,
      getStatusClass,
      getStatusBadgeClass,
      toggleDetail,
      formatDebugInfo,
      expandedDetails,
      formatProb,
      formatCurrency,
      formatNumber,
      formatTime,
      getTradeStatusText
    }
  }
}
</script>

<style scoped>
.scheduled-task-container {
  padding: 20px;
  max-width: 1800px;
  margin: 0 auto;
  width: 100%;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
}

.task-control-section {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.status-box {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  font-weight: 500;
  color: #666;
}

.status-value {
  font-weight: 600;
  font-size: 16px;
}

.status-running {
  color: #28a745;
}

.status-stopped {
  color: #dc3545;
}

.control-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.main-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
  width: 100%;
  min-height: 400px;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  min-width: 0;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  min-width: 0;
}

.config-section,
.symbols-section,
.stats-section,
.trades-section,
.order-attempts-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 2px solid #4a90e2;
  padding-bottom: 8px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: 500;
  color: #666;
  font-size: 14px;
}

.form-group small {
  color: #999;
  font-size: 12px;
  line-height: 1.4;
}

.config-subsection {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.config-subsection:first-of-type {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.subsection-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 2px solid #667eea;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #4a90e2;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.symbols-table,
.trades-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.symbols-table th,
.trades-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #ddd;
}

.symbols-table td,
.trades-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.symbols-table tr:hover,
.trades-table tr:hover {
  background: #f8f9fa;
}

.trend {
  font-weight: 600;
}

.trend-up {
  color: #28a745;
}

.trend-down {
  color: #dc3545;
}

.positive {
  color: #28a745;
  font-weight: 600;
}

.negative {
  color: #dc3545;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
}

.stat-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.page-info {
  color: #666;
  font-size: 14px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #4a90e2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #357abd;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 下单记录样式 */
.attempts-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 20px;
}

.attempts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 1000px;
}

.attempts-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #ddd;
  position: sticky;
  top: 0;
}

.attempts-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.attempts-table tr:hover {
  background: #f8f9fa;
}

.sync-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.sync-badge.synced {
  background: #d4edda;
  color: #155724;
}

.sync-badge.unsynced {
  background: #fff3cd;
  color: #856404;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-planned {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-success {
  background: #e8f5e9;
  color: #388e3c;
}

.badge-failed {
  background: #ffebee;
  color: #d32f2f;
}

.badge-skipped {
  background: #fff3e0;
  color: #f57c00;
}

.status-planned {
  background-color: #f5f5f5;
}

.status-success {
  background-color: #f1f8e9;
}

.status-failed {
  background-color: #ffebee;
}

.status-skipped {
  background-color: #fff3e0;
}

.reason-cell {
  max-width: 300px;
}

.reason-text {
  color: #666;
  font-size: 13px;
}

.error-text {
  color: #d32f2f;
  font-size: 12px;
  display: block;
  margin-top: 4px;
}

.btn-detail {
  padding: 4px 8px;
  font-size: 12px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-detail:hover {
  background: #357abd;
}

.btn-detail.expanded {
  background: #6c757d;
}

.detail-row {
  background: #f8f9fa;
}

.detail-cell {
  padding: 0 !important;
}

.detail-content {
  padding: 15px;
  background: #f8f9fa;
}

.detail-section {
  margin-bottom: 15px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
  font-size: 13px;
}

.detail-value {
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
}

.detail-value.traceback {
  font-family: 'Courier New', monospace;
  color: #d32f2f;
  font-size: 11px;
  line-height: 1.5;
}

.detail-value.debug-info {
  font-family: 'Courier New', monospace;
  color: #333;
  font-size: 11px;
  line-height: 1.5;
}

@media (max-width: 1200px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .task-control-section {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .symbols-table,
  .trades-table,
  .attempts-table {
    font-size: 12px;
  }
  
  .symbols-table th,
  .symbols-table td,
  .trades-table th,
  .trades-table td,
  .attempts-table th,
  .attempts-table td {
    padding: 8px;
  }
  
  .attempts-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .reason-cell {
    max-width: 150px;
  }
}
</style>
