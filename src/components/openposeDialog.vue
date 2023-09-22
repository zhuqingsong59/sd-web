<template>
  <a-modal
    v-model:visible="visible"
    title="openPose"
    width="1800px"
    class="openpose-dialog"
    @ok="handleOk"
  >
    <iframe :src="iframeSrc" frameborder="0" ref="iframeRef" @load="iframeLoaded"></iframe>
  </a-modal>
</template>
<script setup>
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'

const visible = ref(false)
const iframeSrc = ref('')
const iframeRef = ref()
const handleOk = () => {}
let messageOption
defineExpose({
  show: (option) => {
    visible.value = true
    messageOption = option
    iframeSrc.value = 'http://localhost:5173/'
  }
})
const iframeLoaded = () => {
  iframeRef.value.contentWindow.postMessage(messageOption, '*')
}

useEventListener(window, 'message', (evt) => {
  const message = evt.data
  console.log('message: ', message)
})
</script>
<style lang="scss">
.ant-modal-body {
  height: 540px;
  iframe {
    width: 100%;
    height: 100%;
  }
}
</style>
