<template>
  <div class="sidebar">
    <el-menu
      class="sidebar-el-menu"
      :default-active="activeMenu"
      :collapse="collapse"
      :background-color="sidebarBgColor"
      :text-color="sidebarTextColor"
      :active-text-color="sidebarActiveColor"
      router
    >
      <el-menu-item index="/order-form">
        <el-icon><Document /></el-icon>
        <template #title>任务下单</template>
      </el-menu-item>
      <el-menu-item index="/scheduled-task">
        <el-icon><Setting /></el-icon>
        <template #title>任务计划</template>
      </el-menu-item>
      <el-menu-item index="/funding-charts">
        <el-icon><DataLine /></el-icon>
        <template #title>可视化展示</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import { Document, Setting, DataLine } from '@element-plus/icons-vue'

export default {
  name: 'Sidebar',
  components: {
    Document,
    Setting,
    DataLine
  },
  setup() {
    const route = useRoute()
    const sidebarCollapse = inject('sidebarCollapse', ref(false))
    
    const activeMenu = computed(() => route.path)
    const collapse = computed(() => sidebarCollapse.value)
    
    const sidebarBgColor = '#324057'
    const sidebarTextColor = '#bfcbd9'
    const sidebarActiveColor = '#409eff'

    return {
      activeMenu,
      collapse,
      sidebarBgColor,
      sidebarTextColor,
      sidebarActiveColor
    }
  }
}
</script>

<style scoped>
.sidebar {
  display: block;
  position: absolute;
  left: 0;
  top: 70px;
  bottom: 0;
  overflow-y: auto;
  z-index: 100;
}

.sidebar::-webkit-scrollbar {
  width: 0;
}

.sidebar-el-menu:not(.el-menu--collapse) {
  width: 250px;
}

.sidebar-el-menu {
  min-height: 100%;
  border-right: none;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>
