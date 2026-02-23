<template>
  <div class="trading-signals-card">
    <div class="signals-header">
      <h2>📊 交易信号预测面板</h2>
      <div class="header-actions">
        <select v-model="selectedSymbol" @change="onSymbolChange" class="symbol-select">
          <option value="">选择交易对</option>
          <option v-for="symbol in availableSymbols" :key="symbol" :value="symbol">
            {{ symbol }}
          </option>
        </select>
        <button class="btn btn-blue" :disabled="loading" @click="loadSignals">
          {{ loading ? '加载中...' : '刷新' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">数据加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="signals" class="signals-content">
      <!-- 核心指标卡片 -->
      <div class="indicators-grid">
        <!-- 做空信号评分 -->
        <div class="indicator-card score-card">
          <div class="indicator-label">做空信号评分</div>
          <div class="indicator-value" :class="getShortScoreClass(shortScore)">
            {{ shortScore.toFixed(1) }}%
          </div>
          <div class="indicator-action" :class="getShortActionClass(shortScore)">
            {{ getShortActionText(shortScore) }}
          </div>
        </div>

        <!-- 空头爆仓概率 -->
        <div class="indicator-card risk-card">
          <div class="indicator-label">空头爆仓概率</div>
          <div class="indicator-value" :class="getRiskClass(signals.risk_level)">
            {{ signals.liquidation_risk.toFixed(1) }}%
          </div>
          <div class="indicator-level" :class="getRiskClass(signals.risk_level)">
            {{ getRiskLevelText(signals.risk_level) }}
          </div>
        </div>

        <!-- 资金费率动量 -->
        <div class="indicator-card momentum-card">
          <div class="indicator-label">资金费率动量</div>
          <div class="indicator-value">
            {{ formatMomentum(signals.funding_momentum) }}
          </div>
          <div class="indicator-trend" :class="getTrendClass(signals.momentum_trend)">
            {{ getTrendText(signals.momentum_trend) }}
          </div>
        </div>

        <!-- 背离评分 -->
        <div class="indicator-card divergence-card">
          <div class="indicator-label">背离评分</div>
          <div class="indicator-value" :class="getDivergenceClass(signals.divergence_score)">
            {{ signals.divergence_score.toFixed(1) }}
          </div>
          <div class="indicator-trap" v-if="signals.is_short_trap">
            ⚠️ 空头陷阱信号
          </div>
          <div v-else class="indicator-trap safe">正常</div>
        </div>
      </div>

      <!-- 可视化图表区域 -->
      <div class="charts-section">
        <!-- 资金费率动量趋势线图 -->
        <div class="chart-container">
          <div class="chart-title">资金费率动量趋势</div>
          <div ref="momentumChart" class="chart"></div>
        </div>

        <!-- 背离指数仪表盘 -->
        <div class="chart-container">
          <div class="chart-title">背离指数仪表盘</div>
          <div ref="divergenceChart" class="chart"></div>
        </div>

        <!-- 爆仓风险热度条 -->
        <div class="chart-container">
          <div class="chart-title">爆仓风险热度</div>
          <div class="risk-bar-container">
            <div 
              class="risk-bar" 
              :style="{ width: signals.liquidation_risk + '%' }"
              :class="getRiskClass(signals.risk_level)"
            ></div>
            <div class="risk-labels">
              <span>低</span>
              <span>中</span>
              <span>高</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../utils/api'
import * as echarts from 'echarts'

export default {
  name: 'TradingSignals',
  props: {
    symbol: {
      type: String,
      default: ''
    },
    availableSymbols: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      loading: false,
      error: null,
      signals: null,
      selectedSymbol: '',
      momentumChart: null,
      divergenceChart: null
    }
  },
  computed: {
    // 统一做空信号评分：优先使用后端的 short_signal_score，兼容旧版用 100 - long_signal_score
    shortScore() {
      if (!this.signals) return 0
      if (typeof this.signals.short_signal_score === 'number') {
        return this.signals.short_signal_score
      }
      if (typeof this.signals.long_signal_score === 'number') {
        return 100 - this.signals.long_signal_score
      }
      return 0
    }
  },
  watch: {
    symbol(newVal) {
      if (newVal) {
        this.selectedSymbol = newVal
        this.loadSignals()
      }
    }
  },
  mounted() {
    if (this.symbol) {
      this.selectedSymbol = this.symbol
      this.loadSignals()
    }
    window.addEventListener('resize', this.resizeCharts)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.resizeCharts)
    this.disposeCharts()
  },
  methods: {
    async loadSignals() {
      if (!this.selectedSymbol) {
        this.error = '请选择交易对'
        return
      }

      this.loading = true
      this.error = null

      try {
        const response = await api.get('/signals/predict', {
          params: { symbol: this.selectedSymbol }
        })

        if (response.data.success) {
          this.signals = response.data
          // 等待 DOM 渲染完成后再更新图表
          await this.$nextTick()
          this.updateCharts()
        } else {
          this.error = response.data.error || '获取信号失败'
        }
      } catch (error) {
        console.error('加载交易信号失败:', error)
        this.error = error.response?.data?.error || error.message || '加载失败'
      } finally {
        this.loading = false
      }
    },
    initCharts() {
      return new Promise((resolve) => {
        this.$nextTick(() => {
          // 初始化动量趋势图
          if (this.$refs.momentumChart && !this.momentumChart) {
            this.momentumChart = echarts.init(this.$refs.momentumChart)
          }
          // 初始化背离指数仪表盘
          if (this.$refs.divergenceChart && !this.divergenceChart) {
            this.divergenceChart = echarts.init(this.$refs.divergenceChart)
          }
          // 延迟一下确保图表容器已完全渲染
          setTimeout(() => {
            resolve()
          }, 100)
        })
      })
    },
    async updateCharts() {
      if (!this.signals) return

      // 确保图表已初始化
      await this.initCharts()

      // 等待 DOM 更新后再更新图表
      await this.$nextTick()
      
      // 再次检查图表是否已初始化
      if (!this.momentumChart && this.$refs.momentumChart) {
        this.momentumChart = echarts.init(this.$refs.momentumChart)
      }
      if (!this.divergenceChart && this.$refs.divergenceChart) {
        this.divergenceChart = echarts.init(this.$refs.divergenceChart)
      }

      this.$nextTick(() => {
        // 更新动量趋势图
        if (this.momentumChart) {
          const momentum = this.signals.funding_momentum
          const trend = this.signals.momentum_trend
          
          this.momentumChart.setOption({
            tooltip: {
              trigger: 'axis',
              formatter: (params) => {
                const param = params[0]
                return `${param.name}<br/>${param.seriesName}: ${(param.value * 100).toFixed(4)}%`
              }
            },
            grid: {
              left: '10%',
              right: '10%',
              top: '10%',
              bottom: '15%'
            },
            xAxis: {
              type: 'category',
              data: ['历史平均', '当前'],
              axisLabel: {
                color: '#666'
              }
            },
            yAxis: {
              type: 'value',
              name: '资金费率 (%)',
              nameTextStyle: {
                color: '#666'
              },
              axisLabel: {
                formatter: '{value}%',
                color: '#666'
              },
              splitLine: {
                lineStyle: {
                  color: '#e0e0e0'
                }
              }
            },
            series: [{
              name: '资金费率动量',
              type: 'line',
              smooth: true,
              data: [0, momentum * 100],
              itemStyle: {
                color: trend === 'falling' ? '#f56c6c' : '#67c23a'
              },
              lineStyle: {
                width: 3
              },
              markLine: {
                data: [{ yAxis: 0, name: '基准线' }],
                lineStyle: {
                  color: '#999',
                  type: 'dashed'
                }
              }
            }]
          })
        }

        // 更新背离指数仪表盘
        if (this.divergenceChart) {
          const score = this.signals.divergence_score
          
          this.divergenceChart.setOption({
            backgroundColor: 'transparent',
            series: [{
              type: 'gauge',
              startAngle: 180,
              endAngle: 0,
              min: 0,
              max: 100,
              splitNumber: 10,
              radius: '85%',
              center: ['50%', '60%'],
              axisLine: {
                lineStyle: {
                  width: 15,
                  color: [
                    [0.3, '#67c23a'],
                    [0.7, '#e6a23c'],
                    [1, '#f56c6c']
                  ]
                }
              },
              pointer: {
                itemStyle: {
                  color: '#333',
                  shadowColor: 'rgba(0, 0, 0, 0.3)',
                  shadowBlur: 5
                },
                length: '60%',
                width: 5
              },
              axisTick: {
                distance: -25,
                length: 8,
                lineStyle: {
                  color: '#999',
                  width: 1
                }
              },
              splitLine: {
                distance: -30,
                length: 14,
                lineStyle: {
                  color: '#999',
                  width: 2
                }
              },
              axisLabel: {
                color: '#666',
                distance: -50,
                fontSize: 12,
                formatter: (value) => {
                  if (value === 0 || value === 50 || value === 100) {
                    return value
                  }
                  return ''
                }
              },
              detail: {
                valueAnimation: true,
                formatter: '{value}',
                color: '#333',
                fontSize: 24,
                fontWeight: 'bold',
                offsetCenter: [0, '20%']
              },
              title: {
                show: true,
                offsetCenter: [0, '40%'],
                fontSize: 14,
                color: '#666'
              },
              data: [{
                value: score,
                name: '背离指数'
              }]
            }]
          })
        }
      })
    },
    resizeCharts() {
      if (this.momentumChart) {
        this.momentumChart.resize()
      }
      if (this.divergenceChart) {
        this.divergenceChart.resize()
      }
    },
    disposeCharts() {
      if (this.momentumChart) {
        this.momentumChart.dispose()
        this.momentumChart = null
      }
      if (this.divergenceChart) {
        this.divergenceChart.dispose()
        this.divergenceChart = null
      }
    },
    formatMomentum(value) {
      if (value === null || value === undefined) return '-'
      return (value * 100).toFixed(4) + '%'
    },
    getScoreClass(score) {
      if (score >= 70) return 'score-high'
      if (score >= 40) return 'score-medium'
      return 'score-low'
    },
    // 做空信号评分：高分（做空信号强）显示红色，低分（做空信号弱）显示绿色
    getShortScoreClass(shortScore) {
      if (shortScore >= 70) return 'score-high'  // 做空信号强，显示红色
      if (shortScore >= 40) return 'score-medium'  // 做空信号中等，显示橙色
      return 'score-low'  // 做空信号弱，显示绿色
    },
    getActionClass(action) {
      if (action === 'LONG') return 'action-long'
      if (action === 'HOLD') return 'action-hold'
      return 'action-short'
    },
    getActionText(action) {
      const map = {
        'LONG': '🟢 做多',
        'HOLD': '🟡 持有',
        'SHORT': '🔴 做空'
      }
      return map[action] || action
    },
    // 做空信号评分的操作建议：高分建议做空，低分建议做多
    getShortActionClass(shortScore) {
      if (shortScore >= 70) return 'action-short'  // 做空信号强，建议做空
      if (shortScore >= 40) return 'action-hold'  // 做空信号中等，建议持有
      return 'action-long'  // 做空信号弱，建议做多
    },
    getShortActionText(shortScore) {
      if (shortScore >= 70) return '🔴 做空'
      if (shortScore >= 40) return '🟡 持有'
      return '🟢 做多'
    },
    getRiskClass(level) {
      if (level === 'high') return 'risk-high'
      if (level === 'medium') return 'risk-medium'
      return 'risk-low'
    },
    getRiskLevelText(level) {
      const map = {
        'high': '高风险',
        'medium': '中风险',
        'low': '低风险'
      }
      return map[level] || level
    },
    getTrendClass(trend) {
      if (trend === 'falling') return 'trend-falling'
      if (trend === 'rising') return 'trend-rising'
      return 'trend-unknown'
    },
    getTrendText(trend) {
      const map = {
        'falling': '⬇️ 下降（空头增强）',
        'rising': '⬆️ 上升（空头减弱）',
        'unknown': '未知'
      }
      return map[trend] || trend
    },
    getDivergenceClass(score) {
      if (score >= 70) return 'divergence-high'
      if (score >= 50) return 'divergence-medium'
      return 'divergence-low'
    }
  }
}
</script>

<style scoped>
.trading-signals-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.signals-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.signals-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.symbol-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.indicators-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.indicator-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.indicator-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.indicator-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 10px;
}

.score-high { color: #f56c6c; }  /* 高分显示红色（做空信号强） */
.score-medium { color: #e6a23c; }  /* 中分显示橙色 */
.score-low { color: #67c23a; }  /* 低分显示绿色（做空信号弱） */

.indicator-action {
  font-size: 16px;
  font-weight: bold;
  padding: 8px;
  border-radius: 4px;
  margin-top: 10px;
}

.action-long { background: #f0f9ff; color: #67c23a; }
.action-hold { background: #fffbf0; color: #e6a23c; }
.action-short { background: #fff0f0; color: #f56c6c; }

.risk-high { color: #f56c6c; }
.risk-medium { color: #e6a23c; }
.risk-low { color: #67c23a; }

.indicator-level {
  font-size: 14px;
  font-weight: bold;
  margin-top: 5px;
}

.indicator-trend {
  font-size: 14px;
  font-weight: bold;
  margin-top: 5px;
}

.trend-falling { color: #f56c6c; }
.trend-rising { color: #67c23a; }
.trend-unknown { color: #909399; }

.indicator-trap {
  font-size: 14px;
  font-weight: bold;
  margin-top: 5px;
  color: #f56c6c;
}

.indicator-trap.safe {
  color: #67c23a;
}

.divergence-high { color: #f56c6c; }
.divergence-medium { color: #e6a23c; }
.divergence-low { color: #67c23a; }

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.chart-container {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.chart {
  width: 100%;
  height: 200px;
}

.risk-bar-container {
  position: relative;
  height: 40px;
  background: #f0f0f0;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 10px;
}

.risk-bar {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 20px;
}

.risk-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  padding: 0 5px;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  color: #f56c6c;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-blue {
  background: #409eff;
  color: #fff;
}

.btn-blue:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-blue:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}
</style>
