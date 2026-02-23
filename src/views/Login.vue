<template>
  <div class="login-bg">
    <div class="login-container">
      <div class="login-header">
        <div class="login-title">后台管理系统</div>
      </div>
      <el-form :model="param" :rules="rules" ref="loginFormRef" size="large">
        <el-form-item prop="username">
          <el-input v-model="param.username" placeholder="用户名">
            <template #prepend>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            type="password"
            placeholder="密码"
            v-model="param.password"
            @keyup.enter="submitForm"
            show-password
          >
            <template #prepend>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-button class="login-btn" type="primary" size="large" @click="submitForm" :loading="loading">
          登录
        </el-button>
        <div v-if="error" class="error-message">{{ error }}</div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import api from '../utils/api'

export default {
  name: 'Login',
  components: {
    User,
    Lock
  },
  setup() {
    const router = useRouter()
    const loginFormRef = ref(null)
    const loading = ref(false)
    const error = ref('')

    const param = reactive({
      username: '',
      password: ''
    })

    const rules = {
      username: [
        {
          required: true,
          message: '请输入用户名',
          trigger: 'blur'
        }
      ],
      password: [
        {
          required: true,
          message: '请输入密码',
          trigger: 'blur'
        }
      ]
    }

    const submitForm = async () => {
      if (!loginFormRef.value) return

      await loginFormRef.value.validate(async (valid) => {
        if (valid) {
          loading.value = true
          error.value = ''

          // 显示全屏加载提示
          const loadingInstance = ElLoading.service({
            lock: true,
            text: '正在登录，请稍后...',
            background: 'rgba(0, 0, 0, 0.7)'
          })

          try {
            const response = await api.post('/login', {
              username: param.username,
              password: param.password
            })

            if (response.data.success) {
              loadingInstance.text = '登录成功，正在跳转...'
              ElMessage.success('登录成功')
              
              // 等待一下确保 session 已设置，然后跳转
              setTimeout(() => {
                router.push('/order-form').catch(err => {
                  // 如果路由跳转失败，可能是路由守卫拦截，尝试刷新页面
                  if (err.name !== 'NavigationDuplicated') {
                    window.location.href = '/order-form'
                  }
                })
                // 延迟关闭加载提示，确保页面开始加载
                setTimeout(() => {
                  loadingInstance.close()
                }, 500)
              }, 100)
            } else {
              loadingInstance.close()
              error.value = response.data.message || '登录失败'
            }
          } catch (err) {
            loadingInstance.close()
            error.value = err.response?.data?.message || '登录失败，请检查网络连接'
          } finally {
            loading.value = false
          }
        }
      })
    }

    return {
      param,
      rules,
      loginFormRef,
      loading,
      error,
      submitForm
    }
  }
}
</script>

<style scoped>
.login-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4a90e2 100%);
}

.login-container {
  width: 450px;
  border-radius: 8px;
  background: #fff;
  padding: 40px 50px 50px;
  box-sizing: border-box;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
}

.login-title {
  font-size: 24px;
  color: #333;
  font-weight: bold;
}

.login-btn {
  display: block;
  width: 100%;
  margin-top: 20px;
}

.error-message {
  color: #f56c6c;
  margin-top: 16px;
  padding: 12px;
  background: #fef0f0;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .login-container {
    width: 90%;
    padding: 30px 20px;
  }

  .login-title {
    font-size: 20px;
  }
}
</style>
