<template>
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span v-if="balance !== null" class="balance-display">
          可用资金: <strong>{{ formatBalance(balance) }} USDT</strong>
        </span>
        <button type="button" @click="loadBalance" class="btn btn-secondary" :disabled="loadingBalance">
          {{ loadingBalance ? '查询中...' : '查询资金' }}
        </button>
      </div>
    </div>
    
    <!-- Tab切换 -->
    <div class="tab-container" style="margin-bottom: 20px;">
      <button
        type="button"
        :class="['tab-button', { active: activeTab === 'MARKET' }]"
        @click="activeTab = 'MARKET'"
      >
        快速下单市价单任务
      </button>
      <button
        type="button"
        :class="['tab-button', { active: activeTab === 'LIMIT' }]"
        @click="activeTab = 'LIMIT'"
      >
        快速下单限价单任务
      </button>
    </div>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>合约名称</label>
        <div style="display: flex; gap: 10px; align-items: center;">
          <input
            type="text"
            v-model="form.symbolBase"
            required
            placeholder="BTC"
            style="text-transform: uppercase; flex: 1;"
            @input="updateSymbol"
          />
          <select
            v-model="form.symbolQuote"
            required
            style="flex: 0 0 100px;"
            @change="updateSymbol"
          >
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
          </select>
        </div>
        <small style="color: #666; margin-top: 5px; display: block;">
          输入币种名称（如BTC），选择结算货币（USDT/USDC）
        </small>
      </div>
      
      <div class="form-group">
        <label>开仓方向</label>
        <div class="radio-group">
          <div class="radio-option">
            <input
              type="radio"
              id="side-buy"
              value="1"
              v-model="form.side"
              required
            />
            <label for="side-buy">1️⃣ 开多（BUY）</label>
          </div>
          <div class="radio-option">
            <input
              type="radio"
              id="side-sell"
              value="2"
              v-model="form.side"
            />
            <label for="side-sell">2️⃣ 开空（SELL）</label>
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label>杠杆倍数</label>
        <div class="radio-group" style="flex-wrap: wrap;">
          <div class="radio-option">
            <input type="radio" id="lev-1" value="1" v-model="form.leverage" required />
            <label for="lev-1">1️⃣ 2x倍</label>
          </div>
          <div class="radio-option">
            <input type="radio" id="lev-2" value="2" v-model="form.leverage" />
            <label for="lev-2">2️⃣ 5x倍</label>
          </div>
          <div class="radio-option">
            <input type="radio" id="lev-3" value="3" v-model="form.leverage" />
            <label for="lev-3">3️⃣ 10x倍</label>
          </div>
          <div class="radio-option">
            <input type="radio" id="lev-4" value="4" v-model="form.leverage" />
            <label for="lev-4">4️⃣ 20x倍</label>
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label>下单延迟（毫秒，如 100）</label>
        <input
          type="number"
          v-model.number="form.delay_ms"
          required
          min="0"
          placeholder="100"
        />
      </div>
      
      <div class="form-group">
        <label>下单百分比（如 20 表示 20%）</label>
        <input
          type="number"
          v-model.number="form.percent"
          required
          min="1"
          max="100"
          step="0.1"
          placeholder="20"
        />
      </div>
      
      <div v-if="activeTab === 'LIMIT'" class="form-group" style="padding: 10px; background: #f0f8ff; border-radius: 4px; border-left: 3px solid #4a90e2;">
        <small style="color: #4a90e2;">
          <strong>限价单说明：</strong><br>
          • 多单（BUY）：限价 = 当前价格 × 1.05<br>
          • 空单（SELL）：限价 = 当前价格 × 0.995
        </small>
      </div>
      
      <button type="submit" class="btn btn-primary" :disabled="loading" style="width: 100%;">
        {{ loading ? '提交中...' : '确定执行' }}
      </button>
      
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>
    </form>
  </div>
</template>

<script>
import api from '../utils/api'

export default {
  name: 'OrderForm',
  data() {
    return {
      activeTab: 'MARKET', // MARKET or LIMIT
      form: {
        symbolBase: '',
        symbolQuote: 'USDT',
        side: '2',
        leverage: '3',
        delay_ms: 100,
        percent: 30
      },
      loading: false,
      error: '',
      success: '',
      balance: null,
      loadingBalance: false
    }
  },
  mounted() {
    // 页面加载时自动查询一次资金
    this.loadBalance()
  },
  methods: {
    updateSymbol() {
      // 自动更新完整合约名称（用于显示，实际提交时再组合）
    },
    async handleSubmit() {
      this.loading = true
      this.error = ''
      this.success = ''
      
      // 组合完整的合约名称
      const symbol = (this.form.symbolBase.toUpperCase() + this.form.symbolQuote.toUpperCase()).trim()
      
      if (!symbol || symbol.length < 4) {
        this.error = '请输入有效的合约名称'
        this.loading = false
        return
      }
      
      try {
        const response = await api.post('/submit_order', {
          symbol: symbol,
          side: this.form.side,
          leverage: this.form.leverage,
          delay_ms: this.form.delay_ms,
          percent: this.form.percent,
          order_type: this.activeTab
        })
        
        if (response.data.success) {
          this.success = response.data.message || '任务提交成功'
          this.$emit('task-submitted', response.data.task_id)
          // 仅清理合约名称，保留其他参数
          this.form.symbolBase = ''
        } else {
          this.error = response.data.message || '提交失败'
        }
      } catch (error) {
        this.error = error.response?.data?.message || '提交失败，请检查网络连接'
      } finally {
        this.loading = false
      }
    },
    async loadBalance() {
      this.loadingBalance = true
      try {
        const response = await api.get('/get_balance')
        if (response.data.success) {
          this.balance = response.data.available_usdt
        } else {
          this.error = response.data.message || '查询资金失败'
        }
      } catch (error) {
        this.error = error.response?.data?.message || '查询资金失败，请检查网络连接'
      } finally {
        this.loadingBalance = false
      }
    },
    formatBalance(balance) {
      if (balance === null || balance === undefined) return '-'
      return balance.toLocaleString('zh-CN', { 
        minimumFractionDigits: 4, 
        maximumFractionDigits: 4 
      })
    },
    selectSymbol(symbol) {
      if (!symbol) {
        return
      }
      // 移除USDT/USDC后缀，提取币种名称
      const baseSymbol = symbol.replace(/USDT$/, '').replace(/USDC$/, '')
      this.form.symbolBase = baseSymbol
      // 判断是USDT还是USDC
      if (symbol.endsWith('USDC')) {
        this.form.symbolQuote = 'USDC'
      } else {
        this.form.symbolQuote = 'USDT'
      }
      this.updateSymbol()
    }
  }
}
</script>

<style scoped>
.tab-container {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid #e0e0e0;
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

</style>
