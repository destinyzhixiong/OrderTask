<template>
  <div class="login-container">
    <!-- 左侧装饰区域 -->
    <div class="login-left">
      <div class="background-elements">
        <!-- 数据屏幕 -->
        <div class="data-screen">
          <div class="screen-content">
            <div class="chart-container">
              <div class="bar-chart">
                <div class="bar" style="height: 40%"></div>
                <div class="bar" style="height: 70%"></div>
                <div class="bar" style="height: 50%"></div>
              </div>
              <div class="pie-chart">
                <div class="pie-segment"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 立方体堆叠 -->
        <div class="cube-stack">
          <div class="cube cube-1"></div>
          <div class="cube cube-2"></div>
          <div class="cube cube-3"></div>
        </div>
        
        <!-- 音符图标 -->
        <div class="music-note">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
        
        <!-- 垂直光线 -->
        <div class="vertical-lines">
          <div class="line line-1"></div>
          <div class="line line-2"></div>
          <div class="line line-3"></div>
        </div>
      </div>
    </div>
    
    <!-- 右侧登录表单 -->
    <div class="login-right">
      <div class="login-card">
        <h1 class="login-title">管理系统</h1>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <input
                type="text"
                v-model="username"
                required
                placeholder="请输入用户名"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-group">
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
              </svg>
              <input
                type="password"
                v-model="password"
                required
                placeholder="请输入密码"
                class="form-input"
              />
            </div>
          </div>
          <button type="submit" class="login-btn" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
          <div v-if="error" class="error-message">{{ error }}</div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../utils/api'

export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      error: ''
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.error = ''
      
      try {
        const response = await api.post('/login', {
          username: this.username,
          password: this.password
        })
        
        if (response.data.success) {
          this.$emit('login-success')
        } else {
          this.error = response.data.message || '登录失败'
        }
      } catch (error) {
        this.error = error.response?.data?.message || '登录失败，请检查网络连接'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* 左侧装饰区域 */
.login-left {
  flex: 1;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4a90e2 100%);
  position: relative;
  overflow: hidden;
}

.background-elements {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 数据屏幕 */
.data-screen {
  position: absolute;
  top: 15%;
  left: 10%;
  width: 200px;
  height: 150px;
  transform: perspective(1000px) rotateY(-15deg) rotateX(5deg);
  background: rgba(74, 144, 226, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 0 30px rgba(74, 144, 226, 0.5);
  animation: glow 3s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 30px rgba(74, 144, 226, 0.5); }
  50% { box-shadow: 0 0 50px rgba(74, 144, 226, 0.8); }
}

.screen-content {
  padding: 15px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-container {
  display: flex;
  gap: 15px;
  align-items: center;
}

.bar-chart {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  height: 80px;
}

.bar {
  width: 20px;
  background: linear-gradient(to top, #4a90e2, #6bb6ff);
  border-radius: 4px 4px 0 0;
  box-shadow: 0 0 10px rgba(107, 182, 255, 0.6);
}

.pie-chart {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: conic-gradient(
    #4a90e2 0deg 120deg,
    rgba(74, 144, 226, 0.3) 120deg 360deg
  );
  box-shadow: 0 0 15px rgba(74, 144, 226, 0.6);
}

/* 立方体堆叠 */
.cube-stack {
  position: absolute;
  bottom: 20%;
  left: 15%;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cube {
  width: 60px;
  height: 60px;
  background: rgba(74, 144, 226, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.3);
  transform: perspective(500px) rotateX(45deg) rotateY(-15deg);
  box-shadow: 0 0 20px rgba(74, 144, 226, 0.6);
  animation: float 4s ease-in-out infinite;
}

.cube-1 {
  animation-delay: 0s;
}

.cube-2 {
  width: 50px;
  height: 50px;
  margin-left: 5px;
  animation-delay: 0.5s;
}

.cube-3 {
  width: 40px;
  height: 40px;
  margin-left: 10px;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% { transform: perspective(500px) rotateX(45deg) rotateY(-15deg) translateY(0); }
  50% { transform: perspective(500px) rotateX(45deg) rotateY(-15deg) translateY(-10px); }
}

/* 音符图标 */
.music-note {
  position: absolute;
  top: 25%;
  left: 20%;
  width: 80px;
  height: 80px;
  color: rgba(255, 255, 255, 0.8);
  filter: drop-shadow(0 0 15px rgba(74, 144, 226, 0.8));
  animation: pulse 2s ease-in-out infinite;
}

.music-note svg {
  width: 100%;
  height: 100%;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
}

/* 垂直光线 */
.vertical-lines {
  position: absolute;
  bottom: 0;
  left: 5%;
  width: 100%;
  height: 100%;
}

.line {
  position: absolute;
  width: 2px;
  background: linear-gradient(to top, rgba(74, 144, 226, 0.8), transparent);
  box-shadow: 0 0 10px rgba(74, 144, 226, 0.6);
  animation: rise 3s ease-in-out infinite;
}

.line-1 {
  left: 10%;
  height: 40%;
  animation-delay: 0s;
}

.line-2 {
  left: 25%;
  height: 60%;
  animation-delay: 1s;
}

.line-3 {
  left: 40%;
  height: 50%;
  animation-delay: 2s;
}

@keyframes rise {
  0% { transform: translateY(100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(-100%); opacity: 0; }
}

/* 右侧登录表单 */
.login-right {
  flex: 0 0 450px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 40px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 40px;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 24px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  width: 20px;
  height: 20px;
  color: #999;
  z-index: 1;
}

.form-input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
  background: #fafafa;
}

.form-input:focus {
  outline: none;
  border-color: #4a90e2;
  background: white;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.form-input::placeholder {
  color: #bbb;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: #1e3c72;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 8px;
}

.login-btn:hover:not(:disabled) {
  background: #2a5298;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(30, 60, 114, 0.4);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  color: #dc3545;
  margin-top: 16px;
  padding: 12px;
  background: #f8d7da;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }
  
  .login-left {
    display: none;
  }
  
  .login-right {
    flex: 1;
    width: 100%;
  }
}
</style>

