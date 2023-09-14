<template>
  <a-modal
    v-model:visible="visible"
    title="openPose"
    width="1800px"
    class="openpose-dialog"
    @ok="handleOk"
  >
    <iframe :src="iframeSrc" frameborder="0" ref="iframeRef"></iframe>
  </a-modal>
</template>
<script setup>
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'

const visible = ref(false)
const iframeSrc = ref('')
const iframeRef = ref()
const handleOk = () => {}

defineExpose({
  show: (option) => {
    visible.value = true
    iframeSrc.value = 'http://127.0.0.1:7860/openpose_editor_index'
    setTimeout(() => {
      iframeRef.value.contentWindow.postMessage(option, '*')
      //   iframeRef.value.contentWindow.focus()
    }, 1000)
  }
})

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
