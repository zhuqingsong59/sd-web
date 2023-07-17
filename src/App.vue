<template>
  <a-layout>
    <a-layout-header>xishui.ai</a-layout-header>
    <a-layout>
      <a-layout-sider width="400">
        <a-collapse v-model:activeKey="activeKey">
          <a-collapse-panel key="prompt" header="提示词">
            <a-textarea
              v-model:value="prompt"
              placeholder="What do you want to see?"
              allow-clear
              :autoSize="{ minRows: 4 }"
            />
          </a-collapse-panel>
          <a-collapse-panel key="negativePrompt" header="反向提示词">
            <a-textarea
              v-model:value="negativePrompt"
              placeholder="What do you want to avoid?"
              :autoSize="{ minRows: 4 }"
              allow-clear
            />
          </a-collapse-panel>
        </a-collapse>
        <div class="batch-size">
          <p>
            图片数量<span>{{ batchSize }}</span>
          </p>
          <a-slider v-model:value="batchSize" :tooltipVisible="false" :min="1" :max="10" />
        </div>
        <div class="generate-div">
          <a-button type="primary" block @click="generate">生成</a-button>
        </div>
      </a-layout-sider>
      <a-layout-content>
        <template v-if="imgSrc">
          <a-image :width="520" :src="imgSrc" />
        </template>
        <div v-else class="placeholder-div">
          <img v-if="!isGenerating" src="@/assets/logo.png" alt="" />
          <a-progress v-else type="circle" :percent="defaultPercent" />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { txt2img, progress } from '@/service'
import { ref } from 'vue'
const activeKey = ref('prompt')
// 关键词
const prompt = ref('beaty，young，glasses')
// 反向关键词
const negativePrompt = ref('')
// 生成数量
const batchSize = ref(1)
// 是否在生成中
const isGenerating = ref(false)
// 百分比展示
const defaultPercent = ref(0)
// 图片地址
const imgSrc = ref('')
const loopProgress = (taskId) => {
  isGenerating.value = true
  progress({
    taskId,
    skip_current_image: true
  }).then(({ data }) => {
    defaultPercent.value = Number((Number(data.data.progress || 0) * 100).toFixed(0))
    if (data.data.current_image) {
      imgSrc.value = 'data:image/png;base64,' + data.data.current_image
    }
    if (defaultPercent.value == 100) {
      isGenerating.value = false
      imgSrc.value = data.data.url
      return
    }
    setTimeout(() => {
      loopProgress(taskId)
    }, 1000)
  })
}
const generate = () => {
  txt2img({
    steps: 32,
    width: 512,
    height: 512,
    prompt: prompt.value,
    negative_prompt: negativePrompt.value,
    batch_size: batchSize.value
  }).then(({ data }) => {
    defaultPercent.value = 0
    loopProgress(data.data)
  })
}
</script>

<style lang="scss">
html,
body,
#app {
  height: 100%;
  margin: 0;
}
#app {
  .ant-layout {
    height: 100%;
    .ant-layout-header {
      color: #ffffff;
    }
    .ant-layout-sider {
      color: #ffffff;
      .ant-collapse {
        background: #001529;
        border-color: #001529;
        .ant-collapse-item {
          border-bottom: none;
          .ant-collapse-header {
            color: #ffffff;
            user-select: none;
          }
          .ant-collapse-content {
            border-top: none;
            .ant-collapse-content-box {
              padding: 12px;
              background: #001529;
            }
          }
        }
      }
      .batch-size {
        padding: 12px;
        p {
          span {
            float: right;
            margin-right: 12px;
          }
        }
      }
      .generate-div {
        padding: 12px;
      }
    }
    .ant-layout-content {
      padding: 12px;
      .placeholder-div {
        width: 520px;
        height: 520px;
        display: flex;
        align-items: center;
        background: #ffffff;
        justify-content: center;
        border-radius: 0.375rem;
        --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color),
          0 2px 4px -2px var(--tw-shadow-color);
        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000),
          var(--tw-shadow);
      }
    }
  }
}
</style>
