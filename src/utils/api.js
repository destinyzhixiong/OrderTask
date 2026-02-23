/**
 * API请求封装，包含加密功能和请求取消
 */
import axios from 'axios'
import { encryptData, decryptData } from './crypto'
import { requestCancelManager } from './requestCancel'

const ENCRYPTION_KEY = 'your-encryption-key-32bytes!!'  // 与后端一致

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000  // 30秒超时
})

// 请求拦截器 - 加密请求数据和添加取消信号
api.interceptors.request.use(
  (config) => {
    // 加密请求数据
    if (config.data && !config.data.encrypted) {
      const dataStr = JSON.stringify(config.data)
      const encrypted = encryptData(dataStr, ENCRYPTION_KEY)
      config.data = { encrypted }
    }

    // 添加请求取消信号
    if (config.cancelKey) {
      config.signal = requestCancelManager.createSignal(config.cancelKey)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 解密响应数据和清理取消信号
api.interceptors.response.use(
  async (response) => {
    // 请求成功，清理取消信号
    if (response.config.cancelKey) {
      requestCancelManager.delete(response.config.cancelKey)
    }

    if (response.data && response.data.encrypted) {
      try {
        const decryptedStr = decryptData(response.data.encrypted, ENCRYPTION_KEY)
        response.data = JSON.parse(decryptedStr)
      } catch (error) {
        console.error('解密失败:', error)
        return Promise.reject(new Error('响应解密失败'))
      }
    }
    return response
  },
  (error) => {
    // 如果是取消请求，不处理错误响应
    if (axios.isCancel && axios.isCancel(error)) {
      return Promise.reject(error)
    }
    // 检查是否是取消错误（不同版本的 axios 可能不同）
    if (error.name === 'CanceledError' || error.message?.includes('canceled') || error.code === 'ERR_CANCELED') {
      return Promise.reject(error)
    }

    // 请求失败，清理取消信号
    if (error.config && error.config.cancelKey) {
      requestCancelManager.delete(error.config.cancelKey)
    }

    if (error.response && error.response.data && error.response.data.encrypted) {
      try {
        const decryptedStr = decryptData(error.response.data.encrypted, ENCRYPTION_KEY)
        error.response.data = JSON.parse(decryptedStr)
      } catch (e) {
        console.error('错误响应解密失败:', e)
      }
    }
    return Promise.reject(error)
  }
)

export default api

