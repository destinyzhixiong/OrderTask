<template>
  <div class="header">
    <div class="header-left">
      <div class="web-title">后台管理系统</div>
      <div class="collapse-btn" @click="toggleSidebar">
        <el-icon v-if="!collapse">
          <Fold />
        </el-icon>
        <el-icon v-else>
          <Expand />
        </el-icon>
      </div>
    </div>
    <div class="header-right">
      <div class="header-user-con">
        <!-- 用户头像 -->
        <el-avatar class="user-avator" :size="30">
          <el-icon><User /></el-icon>
        </el-avatar>
        <!-- 用户名下拉菜单 -->
        <el-dropdown class="user-name" trigger="click" @command="handleCommand">
          <span class="el-dropdown-link">
            {{ username }}
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="change-password">
                <el-icon><Lock /></el-icon> 修改密码
              </el-dropdown-item>
              <el-dropdown-item command="change-api-key">
                <el-icon><Key /></el-icon> 修改API密钥
              </el-dropdown-item>
              <el-dropdown-item command="change-feishu">
                <el-icon><Link /></el-icon> 配置飞书通知
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon> 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 密码修改弹框 -->
    <ChangePasswordDialog
      v-model="showPasswordDialog"
      @success="handlePasswordChangeSuccess"
    />

    <!-- API密钥修改弹框 -->
    <ChangeApiKeyDialog
      v-model="showApiKeyDialog"
      :current-api-key="maskedApiKey"
      :current-api-secret="maskedApiSecret"
      @success="handleApiKeyChangeSuccess"
    />

    <!-- 飞书配置弹框 -->
    <ChangeFeishuDialog
      v-model="showFeishuDialog"
      :current-webhook-url="maskedFeishuUrl"
      :current-keywords="feishuKeywords"
      @success="handleFeishuChangeSuccess"
    />
  </div>
</template>

<script>
import { ref, computed, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Fold, Expand, User, ArrowDown, Lock, Key, SwitchButton, Link } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import api from '../utils/api'
import ChangePasswordDialog from './ChangePasswordDialog.vue'
import ChangeApiKeyDialog from './ChangeApiKeyDialog.vue'
import ChangeFeishuDialog from './ChangeFeishuDialog.vue'

export default {
  name: 'Header',
  components: {
    Fold,
    Expand,
    User,
    ArrowDown,
    Lock,
    Key,
    SwitchButton,
    ChangePasswordDialog,
    ChangeApiKeyDialog,
    ChangeFeishuDialog
  },
  setup() {
    const router = useRouter()
    const toggleSidebar = inject('toggleSidebar')
    const sidebarCollapse = inject('sidebarCollapse', ref(false))
    
    const username = ref('用户')
    const showPasswordDialog = ref(false)
    const showApiKeyDialog = ref(false)
    const showFeishuDialog = ref(false)
    const maskedApiKey = ref('')
    const maskedApiSecret = ref('')
    const maskedFeishuUrl = ref('')
    const feishuKeywords = ref([])
    const maskedFeishuUrl = ref('')

    const collapse = computed(() => sidebarCollapse.value)

    // 加载用户信息
    const loadUserInfo = async () => {
      try {
        const response = await api.get('/user/info')
        if (response.data.success) {
          username.value = response.data.username || '用户'
          if (response.data.api_key) {
            maskedApiKey.value = response.data.api_key
          }
          if (response.data.api_secret) {
            maskedApiSecret.value = response.data.api_secret
          }
          if (response.data.feishu_webhook_url) {
            maskedFeishuUrl.value = response.data.feishu_webhook_url
          }
          if (response.data.feishu_keywords && Array.isArray(response.data.feishu_keywords)) {
            feishuKeywords.value = response.data.feishu_keywords
          }
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
      }
    }

    // 下拉菜单命令处理
    const handleCommand = (command) => {
      if (command === 'change-password') {
        showPasswordDialog.value = true
      } else if (command === 'change-api-key') {
        showApiKeyDialog.value = true
      } else if (command === 'change-feishu') {
        showFeishuDialog.value = true
      } else if (command === 'logout') {
        handleLogout()
      }
    }

    // 退出登录
    const handleLogout = async () => {
      try {
        await api.post('/logout')
        router.push('/login')
      } catch (error) {
        console.error('退出失败:', error)
        router.push('/login')
      }
    }

    // 密码修改成功
    const handlePasswordChangeSuccess = () => {
      ElMessage.success('密码修改成功')
    }

    // API密钥修改成功
    const handleApiKeyChangeSuccess = () => {
      loadUserInfo()
      ElMessage.success('API密钥修改成功')
    }

    // 飞书配置修改成功
    const handleFeishuChangeSuccess = () => {
      loadUserInfo()
      ElMessage.success('飞书配置更新成功')
    }

    onMounted(() => {
      loadUserInfo()
    })

    return {
      username,
      collapse,
      showPasswordDialog,
      showApiKeyDialog,
      showFeishuDialog,
      maskedApiKey,
      maskedApiSecret,
      maskedFeishuUrl,
      feishuKeywords,
      toggleSidebar,
      handleCommand,
      handlePasswordChangeSuccess,
      handleApiKeyChangeSuccess,
      handleFeishuChangeSuccess
    }
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: 70px;
  color: var(--header-text-color);
  background-color: var(--header-bg-color);
  border-bottom: 1px solid #ddd;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  padding-left: 20px;
  height: 100%;
}

.web-title {
  margin: 0 40px 0 10px;
  font-size: 22px;
  font-weight: 500;
}

.collapse-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 0 10px;
  cursor: pointer;
  opacity: 0.8;
  font-size: 22px;
}

.collapse-btn:hover {
  opacity: 1;
}

.header-right {
  float: right;
  padding-right: 50px;
}

.header-user-con {
  display: flex;
  height: 70px;
  align-items: center;
}

.user-avator {
  margin: 0 10px 0 20px;
}

.el-dropdown-link {
  color: var(--header-text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
}

.el-dropdown-menu__item {
  text-align: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .web-title {
    font-size: 16px;
    margin: 0 10px;
  }

  .header-right {
    padding-right: 10px;
  }

  .user-avator {
    margin: 0 5px;
  }
}
</style>
