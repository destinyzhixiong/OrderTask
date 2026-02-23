<template>
  <router-view />
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Helvetica Neue', Helvetica, 'microsoft yahei', arial, STHeiTi, sans-serif;
  height: 100vh;
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
}

:root {
  --header-bg-color: #242f42;
  --header-text-color: #fff;
  --sidebar-bg-color: #324057;
  --sidebar-text-color: #bfcbd9;
  --sidebar-active-color: #409eff;
}
</style>
