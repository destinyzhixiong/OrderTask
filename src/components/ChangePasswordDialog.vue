<template>
  <el-dialog
    v-model="dialogVisible"
    title="修改密码"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="passwordFormRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="left"
    >
      <el-form-item label="当前密码" prop="oldPassword">
        <el-input
          v-model="form.oldPassword"
          type="password"
          placeholder="请输入当前密码"
          show-password
          clearable
        />
      </el-form-item>

      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          placeholder="请输入新密码（至少8位，包含字母和数字）"
          show-password
          clearable
        />
        <div class="password-tips">
          <div :class="['tip-item', { 'tip-valid': hasLength }]">
            <el-icon><Check v-if="hasLength" /><Close v-else /></el-icon>
            至少8个字符
          </div>
          <div :class="['tip-item', { 'tip-valid': hasLetter }]">
            <el-icon><Check v-if="hasLetter" /><Close v-else /></el-icon>
            包含字母
          </div>
          <div :class="['tip-item', { 'tip-valid': hasNumber }]">
            <el-icon><Check v-if="hasNumber" /><Close v-else /></el-icon>
            包含数字
          </div>
          <div :class="['tip-item', { 'tip-valid': hasSpecial }]">
            <el-icon><Check v-if="hasSpecial" /><Close v-else /></el-icon>
            包含特殊字符（推荐）
          </div>
        </div>
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password
          clearable
        />
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
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Close } from '@element-plus/icons-vue'
import api from '../utils/api'

export default {
  name: 'ChangePasswordDialog',
  components: {
    Check,
    Close
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'success'],
  setup(props, { emit }) {
    const dialogVisible = ref(false)
    const submitting = ref(false)
    const passwordFormRef = ref(null)

    const form = ref({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    // 密码强度检测
    const hasLength = computed(() => form.value.newPassword.length >= 8)
    const hasLetter = computed(() => /[a-zA-Z]/.test(form.value.newPassword))
    const hasNumber = computed(() => /[0-9]/.test(form.value.newPassword))
    const hasSpecial = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(form.value.newPassword))

    // 验证规则
    const validateOldPassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入当前密码'))
      } else {
        callback()
      }
    }

    const validateNewPassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入新密码'))
      } else if (value.length < 8) {
        callback(new Error('密码长度至少8位'))
      } else if (!/[a-zA-Z]/.test(value)) {
        callback(new Error('密码必须包含字母'))
      } else if (!/[0-9]/.test(value)) {
        callback(new Error('密码必须包含数字'))
      } else {
        callback()
      }
    }

    const validateConfirmPassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请再次输入新密码'))
      } else if (value !== form.value.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    const rules = {
      oldPassword: [{ validator: validateOldPassword, trigger: 'blur' }],
      newPassword: [{ validator: validateNewPassword, trigger: 'blur' }],
      confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
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
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      if (passwordFormRef.value) {
        passwordFormRef.value.clearValidate()
      }
      dialogVisible.value = false
    }

    // 提交表单
    const handleSubmit = async () => {
      if (!passwordFormRef.value) return

      await passwordFormRef.value.validate(async (valid) => {
        if (valid) {
          submitting.value = true
          try {
            const response = await api.post('/user/change-password', {
              old_password: form.value.oldPassword,
              new_password: form.value.newPassword
            })

            if (response.data.success) {
              ElMessage.success('密码修改成功')
              emit('success')
              handleClose()
            } else {
              ElMessage.error(response.data.error || '密码修改失败')
            }
          } catch (error) {
            console.error('修改密码失败:', error)
            ElMessage.error(error.response?.data?.error || '密码修改失败，请检查网络连接')
          } finally {
            submitting.value = false
          }
        }
      })
    }

    return {
      dialogVisible,
      submitting,
      passwordFormRef,
      form,
      rules,
      hasLength,
      hasLetter,
      hasNumber,
      hasSpecial,
      handleClose,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.password-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.tip-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 16px;
  color: #999;
}

.tip-item .el-icon {
  font-size: 12px;
}

.tip-valid {
  color: #67c23a;
}

.tip-valid .el-icon {
  color: #67c23a;
}

.dialog-footer {
  text-align: right;
}
</style>
