<template>
  <div class="wrapper">
    <Header />
    <Sidebar />
    <div class="content-box" :class="{ 'content-collapse': sidebarCollapse }">
      <div class="content">
        <router-view v-slot="{ Component }">
          <transition name="move" mode="out-in">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, provide } from 'vue'
import Header from '../components/Header.vue'
import Sidebar from '../components/Sidebar.vue'

export default {
  name: 'Home',
  components: {
    Header,
    Sidebar
  },
  setup() {
    const sidebarCollapse = ref(false)

    const toggleSidebar = () => {
      sidebarCollapse.value = !sidebarCollapse.value
    }

    provide('toggleSidebar', toggleSidebar)
    provide('sidebarCollapse', sidebarCollapse)

    return {
      sidebarCollapse
    }
  }
}
</script>

<style scoped>
.wrapper {
  height: 100vh;
  overflow: hidden;
}

.content-box {
  position: absolute;
  left: 250px;
  right: 0;
  top: 70px;
  bottom: 0;
  padding-bottom: 30px;
  transition: left 0.3s ease-in-out;
  background: #eef0fc;
  overflow: hidden;
}

.content {
  width: auto;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
  box-sizing: border-box;
}

.content::-webkit-scrollbar {
  width: 6px;
}

.content::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.content-collapse {
  left: 65px;
}

.move-enter-active,
.move-leave-active {
  transition: opacity 0.1s ease;
}

.move-enter-from,
.move-leave-to {
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .content-box {
    left: 0;
  }

  .content {
    padding: 10px;
  }
}
</style>
