<template>
  <el-dialog
    v-model="dialogVisible"
    title="修改币安API密钥"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="current-keys">
      <div class="key-item">
        <label>当前API Key：</label>
        <span class="masked-key">{{ currentApiKey || '未设置' }}</span>
      </div>
      <div class="key-item">
        <label>当前API Secret：</label>
        <span class="masked-key">{{ currentApiSecret || '未设置' }}</span>
      </div>
    </div>

    <el-form
      ref="apiKeyFormRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="left"
      style="margin-top: 20px;"
    >
      <el-form-item label="新API Key" prop="apiKey">
        <el-input
          v-model="form.apiKey"
          placeholder="请输入新的币安API Key"
          clearable
          show-password
          type="password"
        >
          <template #prepend>
            <el-icon><Key /></el-icon>
          </template>
        </el-input>
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          请确保API Key具有合约交易权限
        </div>
      </el-form-item>

      <el-form-item label="新API Secret" prop="apiSecret">
        <el-input
          v-model="form.apiSecret"
          placeholder="请输入新的币安API Secret"
          clearable
          show-password
          type="password"
        >
          <template #prepend>
            <el-icon><Lock /></el-icon>
          </template>
        </el-input>
        <div class="form-tip">
          <el-icon><WarningFilled /></el-icon>
          API Secret仅用于本地验证，不会上传到服务器
        </div>
      </el-form-item>

      <el-form-item label="确认API Secret" prop="confirmApiSecret">
        <el-input
          v-model="form.confirmApiSecret"
          placeholder="请再次输入API Secret"
          clearable
          show-password
          type="password"
        >
          <template #prepend>
            <el-icon><Lock /></el-icon>
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Key, Lock, InfoFilled, WarningFilled } from '@element-plus/icons-vue'
import api from '../utils/api'

export default {
  name: 'ChangeApiKeyDialog',
  components: {
    Key,
    Lock,
    InfoFilled,
    WarningFilled
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    currentApiKey: {
      type: String,
      default: ''
    },
    currentApiSecret: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'success'],
  setup(props, { emit }) {
    const dialogVisible = ref(false)
    const submitting = ref(false)
    const apiKeyFormRef = ref(null)

    const form = ref({
      apiKey: '',
      apiSecret: '',
      confirmApiSecret: ''
    })

    // 验证规则
    const validateApiKey = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入API Key'))
      } else if (value.length < 10) {
        callback(new Error('API Key格式不正确'))
      } else {
        callback()
      }
    }

    const validateApiSecret = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入API Secret'))
      } else if (value.length < 20) {
        callback(new Error('API Secret格式不正确'))
      } else {
        callback()
      }
    }

    const validateConfirmApiSecret = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请再次输入API Secret'))
      } else if (value !== form.value.apiSecret) {
        callback(new Error('两次输入的API Secret不一致'))
      } else {
        callback()
      }
    }

    const rules = {
      apiKey: [{ validator: validateApiKey, trigger: 'blur' }],
      apiSecret: [{ validator: validateApiSecret, trigger: 'blur' }],
      confirmApiSecret: [{ validator: validateConfirmApiSecret, trigger: 'blur' }]
    }

    // 监听modelValue变化
    watch(() => props.modelValue, (val) => {
      dialogVisible.value = val
    })

    watch(dialogVisible, (val) => {
      emit('update:modelValue', val)
      if (!val) {
        handleClose()
      }
    })

    // 关闭对话框
    const handleClose = () => {
      form.value = {
        apiKey: '',
        apiSecret: '',
        confirmApiSecret: ''
      }
      if (apiKeyFormRef.value) {
        apiKeyFormRef.value.clearValidate()
      }
      dialogVisible.value = false
    }

    // 提交表单
    const handleSubmit = async () => {
      if (!apiKeyFormRef.value) return

      await apiKeyFormRef.value.validate(async (valid) => {
        if (valid) {
          submitting.value = true
          try {
            const response = await api.post('/user/change-api-key', {
              api_key: form.value.apiKey,
              api_secret: form.value.apiSecret
            })

            if (response.data.success) {
              ElMessage.success('API密钥修改成功')
              emit('success')
              handleClose()
            } else {
              ElMessage.error(response.data.error || 'API密钥修改失败')
            }
          } catch (error) {
            console.error('修改API密钥失败:', error)
            ElMessage.error(error.response?.data?.error || 'API密钥修改失败，请检查网络连接')
          } finally {
            submitting.value = false
          }
        }
      })
    }

    return {
      dialogVisible,
      submitting,
      apiKeyFormRef,
      form,
      rules,
      handleClose,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.current-keys {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.key-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.key-item:last-child {
  margin-bottom: 0;
}

.key-item label {
  font-weight: 500;
  color: #606266;
  min-width: 120px;
}

.masked-key {
  font-family: 'Courier New', monospace;
  color: #409eff;
  font-size: 14px;
  letter-spacing: 1px;
}

.form-tip {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.form-tip .el-icon {
  font-size: 14px;
}

.dialog-footer {
  text-align: right;
}
</style>
