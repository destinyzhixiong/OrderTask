<template>
  <div>
    <!-- 交易信号预测面板 - 仅在可视化展示页面显示 -->
    <TradingSignals 
      v-if="mode === 'compare'"
      :symbol="selectedSymbolForSignals"
      :available-symbols="symbols"
      @symbol-selected="handleSignalSymbolSelected"
    />
    
    <div class="card">
      <div class="chart-header">
        <div style="display: flex; gap: 10px;">
          <button v-if="mode === 'top'" class="btn btn-blue" @click="openNewPage">
            可视化展示
          </button>
          <button class="btn btn-blue" :disabled="loading" @click="loadAll">
            {{ loading ? '刷新中...' : '刷新数据' }}
          </button>
        </div>
      </div>
      <div v-if="loading" class="loading">数据加载中...</div>

    <div v-if="mode === 'top'">
      <div class="top-table">
        <div class="table-title">资金费率为负 Top 10</div>
        <table>
          <thead>
            <tr>
              <th>合约</th>
              <th>资金费率</th>
              <th>标记价格</th>
              <th>15m 成交额(USDT)</th>
              <th>15m 趋势</th>
              <th>1m 趋势</th>
              <th>资金费率动量</th>
              <th>下一阶段概率分析</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in topSymbols" :key="item.symbol">
              <td>{{ item.symbol }}</td>
              <td class="negative">{{ formatFundingRate(item.fundingRate) }}</td>
              <td>{{ formatNumber(item.markPrice) }}</td>
              <td>{{ formatNumber(item.volume_15m_usdt) }}</td>
              <td>
                <span
                  v-if="item.trend_15m"
                  :class="[
                    'trend',
                    item.trend_15m === '涨'
                      ? 'trend-up'
                      : item.trend_15m === '跌'
                      ? 'trend-down'
                      : ''
                  ]"
                >
                  {{ item.trend_15m }}
                </span>
                <span v-else class="prob-invalid">-</span>
              </td>
              <td>
                <span
                  v-if="item.trend_1m"
                  :class="[
                    'trend',
                    item.trend_1m === '涨'
                      ? 'trend-up'
                      : item.trend_1m === '跌'
                      ? 'trend-down'
                      : ''
                  ]"
                >
                  {{ item.trend_1m }}
                </span>
                <span v-else class="prob-invalid">-</span>
              </td>
              <td>
                <span v-if="item.funding_momentum !== undefined">
                  {{ formatMomentum(item.funding_momentum) }}
                  <span :class="getMomentumTrendClass(item.momentum_trend)">
                    {{ getMomentumTrendText(item.momentum_trend) }}
                  </span>
                </span>
                <span v-else class="prob-invalid">-</span>
              </td>
              <td class="next-window-cell">
                <div v-if="getNextWindowLabel(item.symbol)" class="next-window-card">
                  <div class="next-window-header">
                    <span class="next-window-title">下一个阶段: {{ getNextWindowLabel(item.symbol) }}</span>
                  </div>
                  <div class="next-window-trends">
                    <span
                      v-if="getNextWindowData(item.symbol, 'trend_24h') && getNextWindowData(item.symbol, 'trend_24h') !== '无数据'"
                      :class="[
                        'trend',
                        getNextWindowData(item.symbol, 'trend_24h') === '涨'
                          ? 'trend-up'
                          : 'trend-down'
                      ]"
                    >
                      24h: {{ getNextWindowData(item.symbol, 'trend_24h') }} (概率: {{ formatProb(getNextWindowData(item.symbol, 'prob_24h')) }})
                    </span>
                    <span v-else-if="getNextWindowData(item.symbol, 'trend_24h') === '无数据'" class="trend trend-invalid">
                      24h: 无数据 (概率: -)
                    </span>
                    <span
                      v-if="getNextWindowData(item.symbol, 'trend_15m') && getNextWindowData(item.symbol, 'trend_15m') !== '无数据'"
                      :class="[
                        'trend',
                        getNextWindowData(item.symbol, 'trend_15m') === '涨'
                          ? 'trend-up'
                          : 'trend-down'
                      ]"
                    >
                      15m: {{ getNextWindowData(item.symbol, 'trend_15m') }} (概率: {{ formatProb(getNextWindowData(item.symbol, 'prob_15m')) }})
                    </span>
                    <span v-else-if="getNextWindowData(item.symbol, 'trend_15m') === '无数据'" class="trend trend-invalid">
                      15m: 无数据 (概率: -)
                    </span>
                    <span
                      v-if="getNextWindowData(item.symbol, 'trend_1m') && getNextWindowData(item.symbol, 'trend_1m') !== '无数据'"
                      :class="[
                        'trend',
                        getNextWindowData(item.symbol, 'trend_1m') === '涨'
                          ? 'trend-up'
                          : 'trend-down'
                      ]"
                    >
                      1m: {{ getNextWindowData(item.symbol, 'trend_1m') }} (概率: {{ formatProb(getNextWindowData(item.symbol, 'prob_1m')) }})
                    </span>
                    <span v-else-if="getNextWindowData(item.symbol, 'trend_1m') === '无数据'" class="trend trend-invalid">
                      1m: 无数据 (概率: -)
                    </span>
                  </div>
                </div>
                <span v-else class="prob-invalid">暂无数据</span>
              </td>
              <td>
                <button class="btn btn-blue btn-small" type="button" @click="selectSymbol(item.symbol)">
                  选择
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="symbols.length === 0" class="loading">暂无数据</div>
    </div>

    <div v-if="mode === 'compare'">
      <div v-if="symbols.length === 0" class="loading">暂无数据</div>
      <div v-else class="symbol-section" v-for="symbol in symbols" :key="symbol">
        <div class="symbol-title">{{ symbol }}</div>
        <div class="chart-grid compare">
          <div class="chart-box">
            <div class="chart-title">24小时涨跌幅（指定时间段）</div>
            <div
              class="chart-canvas"
              :ref="el => registerChart(el, 'drop24h', symbol)"
            ></div>
          </div>
          <div class="chart-box">
            <div class="chart-title">15分钟涨幅</div>
            <div
              class="chart-canvas"
              :ref="el => registerChart(el, 'drop15m', symbol)"
            ></div>
          </div>
          <div class="chart-box">
            <div class="chart-title">1分钟涨幅</div>
            <div
              class="chart-canvas"
              :ref="el => registerChart(el, 'drop1m', symbol)"
            ></div>
          </div>
        </div>
        <div class="analysis-box">
          <div class="analysis-title">时间区间概率分析</div>
          <div v-if="analysisLoading" class="analysis-empty">分析中...</div>
          <div v-else-if="!analysisResults[symbol] || analysisResults[symbol].length === 0" class="analysis-empty">
            暂无分析数据
          </div>
          <div v-else class="analysis-list">
            <div class="analysis-next" v-if="nextWindowBySymbol[symbol]">
              <div class="next-window-header">
                <span class="next-window-title">下一个阶段：{{ nextWindowBySymbol[symbol].label }}</span>
              </div>
              <div class="next-window-trends">
                <span :class="['trend', nextWindowBySymbol[symbol].trend_24h === '涨' ? 'trend-up' : 'trend-down']">
                  24h：{{ nextWindowBySymbol[symbol].trend_24h }}（概率：{{ formatProb(nextWindowBySymbol[symbol].prob_24h) }}）
                </span>
                <span :class="['trend', nextWindowBySymbol[symbol].trend_15m === '涨' ? 'trend-up' : 'trend-down']">
                  15m：{{ nextWindowBySymbol[symbol].trend_15m }}（概率：{{ formatProb(nextWindowBySymbol[symbol].prob_15m) }}）
                </span>
                <span :class="['trend', nextWindowBySymbol[symbol].trend_1m === '涨' ? 'trend-up' : 'trend-down']">
                  1m：{{ nextWindowBySymbol[symbol].trend_1m }}（概率：{{ formatProb(nextWindowBySymbol[symbol].prob_1m) }}）
                </span>
              </div>
            </div>
            <div class="analysis-row" v-for="item in analysisResults[symbol]" :key="item.label">
              <span>时间区间：{{ item.label }}</span>
              <span :class="['trend', item.trend_24h === '涨' ? 'trend-up' : 'trend-down']">
                24h：{{ item.trend_24h }}（概率：{{ formatProb(item.prob_24h) }}）
              </span>
              <span :class="['trend', item.trend_15m === '涨' ? 'trend-up' : 'trend-down']">
                15m：{{ item.trend_15m }}（概率：{{ formatProb(item.prob_15m) }}）
              </span>
              <span :class="['trend', item.trend_1m === '涨' ? 'trend-up' : 'trend-down']">
                1m：{{ item.trend_1m }}（概率：{{ formatProb(item.prob_1m) }}）
              </span>
            </div>
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
import TradingSignals from './TradingSignals.vue'

export default {
  name: 'FundingCharts',
  components: {
    TradingSignals
  },
  props: {
    mode: {
      type: String,
      default: 'top'
    }
  },
  data() {
    return {
      loading: false,
      topSymbols: [],
      selectedSymbolForSignals: '',
      drop24hLabels: [],
      drop24hSeries: [],
      drop24hCandles: [],
      drop15mLabels: [],
      drop15mSeries: [],
      drop15mCandles: [],
      drop1mLabels: [],
      drop1mSeries: [],
      drop1mCandles: [],
      analysisResults: {},
      analysisLoading: false,
      nextWindowLabel: '',
      nextWindowBySymbol: {},
      chartEls: {
        drop24h: {},
        drop15m: {},
        drop1m: {}
      },
      chartInstances: {
        drop24h: {},
        drop15m: {},
        drop1m: {}
      },
      requestKeys: []  // 存储请求的 cancelKey
    }
  },
  computed: {
    symbols() {
      return this.topSymbols.map(item => item.symbol)
    },
    titleText() {
      return this.mode === 'top' ? '可视化数据' : '可视化展示'
    }
  },
  mounted() {
    // 延迟加载，避免阻塞页面渲染
    this.$nextTick(() => {
      setTimeout(() => {
        this.loadAll()
      }, 100)
    })
    window.addEventListener('resize', this.resizeCharts)
  },
  beforeUnmount() {
    // 取消所有正在进行的请求
    this.cancelAllRequests()
    window.removeEventListener('resize', this.resizeCharts)
    this.disposeCharts()
  },
  methods: {
    registerChart(el, type, symbol) {
      if (!el || !symbol || !type) return
      if (!this.chartEls[type]) {
        this.chartEls[type] = {}
      }
      this.chartEls[type][symbol] = el
    },
    initChart(type, symbol) {
      const container = this.chartEls[type]?.[symbol]
      if (!container) return null
      if (!this.chartInstances[type]) {
        this.chartInstances[type] = {}
      }
      if (!this.chartInstances[type][symbol]) {
        this.chartInstances[type][symbol] = echarts.init(container)
      }
      return this.chartInstances[type][symbol]
    },
    disposeCharts() {
      Object.values(this.chartInstances).forEach((typeMap) => {
        Object.values(typeMap).forEach((chart) => {
          if (chart) {
            chart.dispose()
          }
        })
      })
      this.chartInstances = {
        drop24h: {},
        drop15m: {},
        drop1m: {}
      }
    },
    resizeCharts() {
      Object.values(this.chartInstances).forEach((typeMap) => {
        Object.values(typeMap).forEach((chart) => {
          if (chart) {
            chart.resize()
          }
        })
      })
    },
    cancelAllRequests() {
      // 取消所有正在进行的请求
      this.requestKeys.forEach(key => {
        const { requestCancelManager } = require('../utils/requestCancel')
        requestCancelManager.cancel(key)
      })
      this.requestKeys = []
    },
    async loadAll() {
      // 先取消之前的请求
      this.cancelAllRequests()
      
      this.loading = true
      try {
        await this.loadTopSymbols()
        if (this.mode === 'top') {
          // 在 top 模式下也加载下一个阶段的概率数据
          const symbols = this.symbols.join(',')
          if (symbols) {
            await this.loadAnalysis(symbols)
          }
          return
        }
        await this.$nextTick()
        const symbols = this.symbols.join(',')
        await Promise.all([
          this.loadDrop24h(symbols),
          this.loadDrop15m(symbols),
          this.loadDrop1m(symbols),
          this.loadAnalysis(symbols)
        ])
        await this.$nextTick()
        this.renderAllCharts()
      } catch (error) {
        // 如果是取消请求，不显示错误
        if (error.name !== 'CanceledError' && !error.message?.includes('canceled')) {
          console.error('加载图表数据失败:', error)
        }
      } finally {
        this.loading = false
      }
    },
    async loadTopSymbols() {
      const key = `funding-top-${Date.now()}`
      this.requestKeys.push(key)
      try {
        const response = await api.get('/funding/negative_top', {
          params: { limit: 10, funding_interval_hours: 4 },
          cancelKey: key
        })
        if (response.data.success) {
          this.topSymbols = response.data.top || []
        } else {
          this.topSymbols = []
        }
      } catch (error) {
        if (error.name !== 'CanceledError' && !error.message?.includes('canceled')) {
          this.topSymbols = []
        }
        throw error
      } finally {
        const index = this.requestKeys.indexOf(key)
        if (index > -1) {
          this.requestKeys.splice(index, 1)
        }
      }
    },
    formatProb(value) {
      if (value === null || value === undefined || isNaN(value)) return '-'
      return (value * 100).toFixed(1) + '%'
    },
    formatMomentum(value) {
      if (value === null || value === undefined || isNaN(value)) return '-'
      return (value * 100).toFixed(4) + '%'
    },
    getMomentumTrendClass(trend) {
      if (trend === 'falling') return 'momentum-falling'
      if (trend === 'rising') return 'momentum-rising'
      return 'momentum-unknown'
    },
    getMomentumTrendText(trend) {
      if (trend === 'falling') return '下降（空头增强）'
      if (trend === 'rising') return '上升（空头减弱）'
      return '未知'
    },
    getNextWindowLabel(symbol) {
      const nextWindow = this.nextWindowBySymbol[symbol]
      return nextWindow ? nextWindow.label : null
    },
    getNextWindowData(symbol, field) {
      const nextWindow = this.nextWindowBySymbol[symbol]
      return nextWindow ? nextWindow[field] : null
    },
    async loadDrop24h(symbols) {
      const key = `drop-24h-${Date.now()}`
      this.requestKeys.push(key)
      try {
        const response = await api.get('/price/drop_24h_intervals', {
          params: { symbols: symbols },
          cancelKey: key
        })
        if (response.data.success) {
          this.drop24hLabels = response.data.labels || []
          this.drop24hSeries = response.data.series || []
          this.drop24hCandles = response.data.candles || []
        } else {
          this.drop24hLabels = []
          this.drop24hSeries = []
          this.drop24hCandles = []
        }
      } catch (error) {
        if (error.name !== 'CanceledError' && !error.message?.includes('canceled')) {
          this.drop24hLabels = []
          this.drop24hSeries = []
          this.drop24hCandles = []
        }
      } finally {
        const index = this.requestKeys.indexOf(key)
        if (index > -1) {
          this.requestKeys.splice(index, 1)
        }
      }
    },
    async loadDrop15m(symbols) {
      const response = await api.get('/price/drop_15m', {
        params: { symbols: symbols, limit: 32 }
      })
      if (response.data.success) {
        this.drop15mLabels = response.data.labels || []
        this.drop15mSeries = response.data.series || []
        this.drop15mCandles = response.data.candles || []
      } else {
        this.drop15mLabels = []
        this.drop15mSeries = []
        this.drop15mCandles = []
      }
    },
    async loadDrop1m(symbols) {
      const response = await api.get('/price/drop_1m', {
        params: { symbols: symbols, limit: 60 }
      })
      if (response.data.success) {
        this.drop1mLabels = response.data.labels || []
        this.drop1mSeries = response.data.series || []
        this.drop1mCandles = response.data.candles || []
      } else {
        this.drop1mLabels = []
        this.drop1mSeries = []
        this.drop1mCandles = []
      }
    },
    async loadAnalysis(symbols) {
      this.analysisLoading = true
      try {
        const response = await api.get('/analysis/time_windows', {
          params: { symbols: symbols, days_24h: 60, days_15m: 14, days_1m: 2 }
        })
        if (response.data.success) {
          this.analysisResults = response.data.analysis || {}
          this.nextWindowLabel = response.data.next_window_label || ''
          this.nextWindowBySymbol = response.data.next_window || {}
        } else {
          this.analysisResults = {}
          this.nextWindowLabel = ''
          this.nextWindowBySymbol = {}
        }
      } catch (error) {
        console.error('加载分析数据失败:', error)
        this.analysisResults = {}
        this.nextWindowLabel = ''
        this.nextWindowBySymbol = {}
      } finally {
        this.analysisLoading = false
      }
    },
    renderAllCharts() {
      this.disposeCharts()
      if (this.symbols.length === 0) return
      if (this.mode === 'compare') {
        this.symbols.forEach(symbol => {
          this.renderDrop24hChart(symbol)
          this.renderDrop15mChart(symbol)
          this.renderDrop1mChart(symbol)
        })
      }
    },
    renderDrop24hChart(symbol) {
      const chart = this.initChart('drop24h', symbol)
      if (!chart) return
      const candleData = this.getCandleValues(this.drop24hCandles, symbol)
      chart.setOption(this.buildCandleOption(this.drop24hLabels, candleData))
    },
    renderDrop15mChart(symbol) {
      const chart = this.initChart('drop15m', symbol)
      if (!chart) return
      const candleData = this.getCandleValues(this.drop15mCandles, symbol)
      chart.setOption(this.buildCandleOption(this.drop15mLabels, candleData, { barWidth: 12 }))
    },
    renderDrop1mChart(symbol) {
      const chart = this.initChart('drop1m', symbol)
      if (!chart) return
      const candleData = this.getCandleValues(this.drop1mCandles, symbol)
      chart.setOption(this.buildCandleOption(this.drop1mLabels, candleData, { barWidth: 8 }))
    },
    getSeriesValues(seriesList, symbol) {
      const item = (seriesList || []).find(entry => entry.symbol === symbol)
      return item ? (item.values || []) : []
    },
    getCandleValues(candlesList, symbol) {
      const item = (candlesList || []).find(entry => entry.symbol === symbol)
      return item ? (item.values || []) : []
    },
    buildCandleOption(labels, values, options = {}) {
      const { barWidth } = options
      const ma7 = this.calcMA(7, values)
      const ma25 = this.calcMA(25, values)
      const ma99 = this.calcMA(99, values)
      return {
        backgroundColor: '#0b0e11',
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['K', 'MA7', 'MA25', 'MA99'],
          textStyle: { color: '#b7bdc6' }
        },
        grid: { left: 50, right: 20, top: 40, bottom: 40 },
        xAxis: {
          type: 'category',
          data: labels,
          boundaryGap: true,
          axisLine: { lineStyle: { color: '#2b3139' } },
          axisLabel: { color: '#848e9c' }
        },
        yAxis: {
          scale: true,
          axisLine: { lineStyle: { color: '#2b3139' } },
          splitLine: { lineStyle: { color: '#1e2329' } },
          axisLabel: { color: '#848e9c' }
        },
        series: [
          {
            name: 'K',
            type: 'candlestick',
            data: values,
            barWidth: barWidth || undefined,
            itemStyle: {
              color: '#0ecb81',
              color0: '#f6465d',
              borderColor: '#0ecb81',
              borderColor0: '#f6465d'
            }
          },
          {
            name: 'MA7',
            type: 'line',
            data: ma7,
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 1, color: '#f0b90b' }
          },
          {
            name: 'MA25',
            type: 'line',
            data: ma25,
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 1, color: '#c994ff' }
          },
          {
            name: 'MA99',
            type: 'line',
            data: ma99,
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 1, color: '#ff7ad9' }
          }
        ]
      }
    },
    calcMA(dayCount, values) {
      const result = []
      for (let i = 0; i < values.length; i += 1) {
        if (i < dayCount - 1) {
          result.push(null)
          continue
        }
        let sum = 0
        let valid = true
        for (let j = 0; j < dayCount; j += 1) {
          const item = values[i - j]
          if (!item || item.length < 2) {
            valid = false
            break
          }
          sum += item[1]
        }
        if (!valid) {
          result.push(null)
        } else {
          result.push(Number((sum / dayCount).toFixed(4)))
        }
      }
      return result
    },
    formatFundingRate(rate) {
      if (rate === null || rate === undefined) return '-'
      return `${(rate * 100).toFixed(4)}%`
    },
    formatNumber(value) {
      if (value === null || value === undefined) return '-'
      return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 6 })
    },
    formatProb(value) {
      if (value === null || value === undefined) return '-'
      return `${(value * 100).toFixed(1)}%`
    },
    selectSymbol(symbolValue) {
      if (!symbolValue) {
        return
      }
      // 更新交易信号面板的选中符号
      this.selectedSymbolForSignals = symbolValue
      // 触发事件，让父组件处理选择逻辑
      this.$emit('select-symbol', symbolValue)
    },
    handleSignalSymbolSelected(symbol) {
      // 当交易信号面板选择符号时，可以在这里处理
      this.selectedSymbolForSignals = symbol
    },
    openNewPage() {
      const url = `${window.location.origin}${window.location.pathname}?view=funding`
      window.open(url, '_blank')
    }
  }
}
</script>

<style scoped>
.chart-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20px;
}

.tab-container {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 20px;
}

.tab-button {
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: #333;
  background: #f5f5f5;
}

.tab-button.active {
  color: #4a90e2;
  border-bottom-color: #4a90e2;
  font-weight: bold;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 20px;
}

.chart-grid.compare {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.chart-grid.compare .chart-canvas {
  height: 360px;
}

@media (max-width: 1400px) {
  .chart-grid.compare {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .chart-grid.compare {
    grid-template-columns: 1fr;
  }
}

.chart-box {
  border: 1px solid #1e2329;
  border-radius: 10px;
  padding: 16px;
  background: #0b0e11;
  width: 100%;
}

.chart-title {
  font-size: 14px;
  color: #b7bdc6;
  margin-bottom: 10px;
  font-weight: 600;
}

.chart-canvas {
  width: 100%;
  height: 480px;
}

.symbol-section {
  margin-bottom: 30px;
}

.analysis-box {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  background: #fafafa;
}

.analysis-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.analysis-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.analysis-next {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 6px;
  background: #f0f7ff;
  border-left: 3px solid #4a90e2;
  font-size: 13px;
  color: #333;
}

.next-window-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.next-window-title {
  font-weight: 600;
  color: #333;
}

.next-window-trends {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.next-window-cell {
  padding: 8px !important;
  width: auto;
  max-width: 350px;
}

.next-window-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 6px;
  background: #f0f7ff;
  border-left: 3px solid #4a90e2;
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  width: fit-content;
  min-width: 280px;
}

.next-window-card .next-window-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.next-window-card .next-window-title {
  font-weight: 600;
  color: #4a90e2;
  font-size: 13px;
}

.next-window-card .next-window-trends {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
}

.next-window-card .next-window-trends .trend {
  font-weight: 500;
  white-space: nowrap;
}

.next-window-card .next-window-trends .trend.trend-invalid {
  color: #999;
  font-style: italic;
}

.analysis-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #333;
}

.analysis-empty {
  font-size: 13px;
  color: #666;
}

.trend {
  font-weight: 600;
}

.trend-up {
  color: #0ecb81;
}

.trend-down {
  color: #f6465d;
}

.symbol-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-top: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin: 20px 0 10px;
}

.top-table {
  margin-bottom: 20px;
}

.top-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.top-table th,
.top-table td {
  padding: 10px;
  border-bottom: 1px solid #e6e6e6;
  text-align: left;
}

.top-table th {
  color: #666;
  font-weight: 600;
}

.table-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  font-weight: 600;
}

.btn-small {
  padding: 6px 12px;
  font-size: 14px;
}

.btn-blue {
  background: #4a90e2;
  color: #fff;
}

.btn-blue:hover {
  background: #357abd;
}

.btn-blue:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .chart-box {
    padding: 12px;
  }

  .chart-canvas {
    height: 260px;
  }

  .chart-grid.compare {
    grid-template-columns: 1fr;
  }

  .symbol-title {
    font-size: 14px;
  }

  .table-title {
    font-size: 13px;
  }

  .top-table {
    overflow-x: auto;
  }

  .top-table table {
    min-width: 520px;
    font-size: 12px;
  }

  .btn-small {
    padding: 4px 8px;
    font-size: 12px;
  }

  .analysis-box {
    padding: 10px;
  }

  .analysis-title {
    font-size: 13px;
  }

  .analysis-next {
    font-size: 12px;
    gap: 8px;
  }

  .analysis-row {
    font-size: 12px;
    gap: 8px;
  }
}

.negative {
  color: #d9534f;
  font-weight: 600;
}
.momentum-rising {
  color: #67c23a;
  font-weight: 600;
  margin-left: 6px;
}
.momentum-falling {
  color: #f56c6c;
  font-weight: 600;
  margin-left: 6px;
}
.momentum-unknown {
  color: #909399;
  font-weight: 600;
  margin-left: 6px;
}
</style>
