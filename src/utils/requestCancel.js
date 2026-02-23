/**
 * 请求取消管理器
 * 用于在路由切换或组件卸载时取消正在进行的请求
 */
class RequestCancelManager {
  constructor() {
    this.controllers = new Map()
  }

  /**
   * 创建并存储一个 AbortController
   * @param {string} key - 请求的唯一标识
   * @returns {AbortSignal} - 用于取消请求的信号
   */
  createSignal(key) {
    // 如果已存在，先取消之前的请求
    if (this.controllers.has(key)) {
      this.controllers.get(key).abort()
    }

    const controller = new AbortController()
    this.controllers.set(key, controller)
    return controller.signal
  }

  /**
   * 取消指定的请求
   * @param {string} key - 请求的唯一标识
   */
  cancel(key) {
    if (this.controllers.has(key)) {
      this.controllers.get(key).abort()
      this.controllers.delete(key)
    }
  }

  /**
   * 取消所有请求
   */
  cancelAll() {
    this.controllers.forEach((controller) => {
      controller.abort()
    })
    this.controllers.clear()
  }

  /**
   * 删除指定的控制器（请求已完成）
   * @param {string} key - 请求的唯一标识
   */
  delete(key) {
    this.controllers.delete(key)
  }
}

// 创建全局实例
export const requestCancelManager = new RequestCancelManager()

// 为每个路由创建独立的取消管理器
export const createRouteCancelManager = () => {
  return new RequestCancelManager()
}
