<template>
  <el-dialog
    v-model="dialogVisible"
    title="配置飞书通知"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="current-config">
      <div class="config-item">
        <label>当前Webhook URL：</label>
        <span class="masked-url">{{ currentWebhookUrl || '未设置' }}</span>
      </div>
      <div class="config-item" style="margin-top: 10px;">
        <label>当前关键词：</label>
        <span class="keywords-display">
          <el-tag v-for="(keyword, index) in currentKeywords" :key="index" size="small" style="margin-right: 5px;">
            {{ keyword }}
          </el-tag>
          <span v-if="!currentKeywords || currentKeywords.length === 0" style="color: #909399;">未设置</span>
        </span>
      </div>
    </div>

    <el-form
      ref="feishuFormRef"
      :model="form"
      :rules="rules"
      label-width="140px"
      label-position="left"
      style="margin-top: 20px;"
    >
      <el-form-item label="飞书Webhook URL" prop="webhookUrl">
        <el-input
          v-model="form.webhookUrl"
          placeholder="请输入飞书机器人Webhook URL"
          clearable
        >
          <template #prepend>
            <el-icon><Link /></el-icon>
          </template>
        </el-input>
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          格式：https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx
        </div>
        <div class="form-tip" style="margin-top: 5px;">
          <el-icon><WarningFilled /></el-icon>
          留空则禁用飞书通知功能
        </div>
      </el-form-item>

      <el-form-item label="自定义关键词" prop="keywords">
        <el-input
          v-model="form.keywordsText"
          type="textarea"
          :rows="4"
          placeholder="请输入关键词，每行一个（例如：MCP&#10;交易&#10;通知）"
          clearable
        />
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          每行一个关键词，消息内容必须包含至少一个关键词才能发送成功
        </div>
        <div class="form-tip" style="margin-top: 5px;">
          <el-icon><WarningFilled /></el-icon>
          如果飞书机器人配置了关键词过滤，必须在此处配置相同的关键词
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button @click="handleTest" :loading="testing" type="warning">
          <el-icon><Promotion /></el-icon> 测试通知
        </el-button>
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
import { Link, InfoFilled, WarningFilled, Promotion } from '@element-plus/icons-vue'
import api from '../utils/api'

export default {
  name: 'ChangeFeishuDialog',
  components: {
    Link,
    InfoFilled,
    WarningFilled,
    Promotion
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    currentWebhookUrl: {
      type: String,
      default: ''
    },
    currentKeywords: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'success'],
  setup(props, { emit }) {
    const dialogVisible = ref(false)
    const submitting = ref(false)
    const testing = ref(false)
    const feishuFormRef = ref(null)

    const form = ref({
      webhookUrl: '',
      keywordsText: ''
    })

    // 验证规则
    const validateWebhookUrl = (rule, value, callback) => {
      if (!value) {
        // 允许为空（禁用通知）
        callback()
        return
      }
      if (!value.startsWith('https://')) {
        callback(new Error('Webhook URL 必须以 https:// 开头'))
      } else if (!value.includes('open.feishu.cn')) {
        callback(new Error('Webhook URL 格式不正确，应为飞书机器人URL'))
      } else {
        callback()
      }
    }

    const rules = {
      webhookUrl: [{ validator: validateWebhookUrl, trigger: 'blur' }]
    }

    // 监听modelValue变化
    watch(() => props.modelValue, (val) => {
      dialogVisible.value = val
      if (val) {
        // 打开对话框时，加载当前配置
        loadCurrentConfig()
      }
    })

    watch(dialogVisible, (val) => {
      emit('update:modelValue', val)
      if (!val) {
        handleClose()
      }
    })

    // 加载当前配置
    const loadCurrentConfig = async () => {
      try {
        const response = await api.get('/user/feishu-config')
        if (response.data.success) {
          form.value.webhookUrl = response.data.feishu_webhook_url || ''
          // 将关键词数组转换为文本（每行一个）
          if (response.data.feishu_keywords && Array.isArray(response.data.feishu_keywords)) {
            form.value.keywordsText = response.data.feishu_keywords.join('\n')
          } else {
            form.value.keywordsText = ''
          }
        }
      } catch (error) {
        console.error('加载飞书配置失败:', error)
      }
    }

    // 关闭对话框
    const handleClose = () => {
      form.value = {
        webhookUrl: '',
        keywordsText: ''
      }
      if (feishuFormRef.value) {
        feishuFormRef.value.clearValidate()
      }
      dialogVisible.value = false
    }

    // 测试通知
    const handleTest = async () => {
      if (!form.value.webhookUrl) {
        ElMessage.warning('请先配置 Webhook URL')
        return
      }

      testing.value = true
      try {
        const response = await api.post('/user/feishu-test')
        if (response.data.success) {
          ElMessage.success('测试消息已发送，请检查飞书群组')
        } else {
          ElMessage.error(response.data.error || '测试失败')
        }
      } catch (error) {
        console.error('测试飞书通知失败:', error)
        ElMessage.error(error.response?.data?.error || '测试失败，请检查网络连接')
      } finally {
        testing.value = false
      }
    }

    // 提交表单
    const handleSubmit = async () => {
      if (!feishuFormRef.value) return

      await feishuFormRef.value.validate(async (valid) => {
        if (valid) {
          submitting.value = true
          try {
            // 将关键词文本转换为数组（按换行符分割，过滤空行）
            const keywordsArray = form.value.keywordsText
              .split('\n')
              .map(k => k.trim())
              .filter(k => k.length > 0)

            const response = await api.post('/user/feishu-config', {
              feishu_webhook_url: form.value.webhookUrl,
              feishu_keywords: keywordsArray
            })

            if (response.data.success) {
              ElMessage.success('飞书配置更新成功')
              emit('success')
              handleClose()
            } else {
              ElMessage.error(response.data.error || '飞书配置更新失败')
            }
          } catch (error) {
            console.error('更新飞书配置失败:', error)
            ElMessage.error(error.response?.data?.error || '飞书配置更新失败，请检查网络连接')
          } finally {
            submitting.value = false
          }
        }
      })
    }

    return {
      dialogVisible,
      submitting,
      testing,
      feishuFormRef,
      form,
      rules,
      handleClose,
      handleSubmit,
      handleTest
    }
  }
}
</script>

<style scoped>
.current-config {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.config-item {
  display: flex;
  align-items: center;
}

.config-item label {
  font-weight: 500;
  color: #606266;
  min-width: 140px;
}

.masked-url {
  font-family: 'Courier New', monospace;
  color: #409eff;
  font-size: 14px;
  word-break: break-all;
}

.keywords-display {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
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
