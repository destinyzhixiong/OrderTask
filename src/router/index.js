import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import api from '../utils/api'
import { requestCancelManager } from '../utils/requestCancel'
import { ElLoading } from 'element-plus'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: Home,
    redirect: '/order-form',
    children: [
      {
        path: 'order-form',
        name: 'OrderForm',
        component: () => import('../views/OrderForm.vue'),
        meta: { title: '任务下单' }
      },
      {
        path: 'scheduled-task',
        name: 'ScheduledTask',
        component: () => import('../views/ScheduledTask.vue'),
        meta: { title: '任务计划' }
      },
      {
        path: 'funding-charts',
        name: 'FundingCharts',
        component: () => import('../views/FundingCharts.vue'),
        meta: { title: '可视化展示' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局加载提示实例
let loadingInstance = null

// 关闭加载提示的辅助函数
const closeLoading = () => {
  if (loadingInstance) {
    loadingInstance.close()
    loadingInstance = null
  }
}

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 检查登录状态
  if (to.path === '/login') {
    // 登录页面，取消所有请求
    requestCancelManager.cancelAll()
    // 关闭之前的加载提示
    closeLoading()
    next()
    return
  }

  // 路由切换时，取消之前页面的所有请求
  if (from.path !== '/' && from.path !== to.path && from.path !== '/login') {
    requestCancelManager.cancelAll()
    
    // 显示加载提示（仅在菜单切换时）
    if (from.path.startsWith('/') && to.path.startsWith('/')) {
      // 关闭之前的加载提示
      closeLoading()
      // 显示新的加载提示
      loadingInstance = ElLoading.service({
        lock: true,
        text: '正在加载，请稍后...',
        background: 'rgba(0, 0, 0, 0.7)'
      })
    }
  }

  // 检查是否已登录 - 使用 api 工具处理加密响应
  try {
    const response = await api.get('/check_auth', {
      cancelKey: 'check-auth'
    })
    
    if (response.data && response.data.authenticated) {
      next()
    } else {
      closeLoading()
      next('/login')
    }
  } catch (error) {
    // 如果是取消请求，不处理
    if (error.name === 'CanceledError' || error.message?.includes('canceled')) {
      return
    }
    console.error('检查登录状态失败:', error)
    closeLoading()
    next('/login')
  }
})

// 路由切换完成后关闭加载提示
router.afterEach(() => {
  // 延迟关闭，确保页面开始渲染
  setTimeout(() => {
    closeLoading()
  }, 300)
})

export default router
