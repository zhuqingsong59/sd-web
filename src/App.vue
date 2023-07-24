<template>
  <a-layout>
    <a-layout-header>xishui.ai</a-layout-header>
    <a-layout>
      <a-layout-sider width="400">
        <div class="aside-content">
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
            <a-collapse-panel key="uploadImage" header="上传图片">
              <div class="uploaded-image" v-if="uploadImg">
                <img :src="uploadImg" />
                <DeleteFilled @click="deleteImg" />
              </div>
              <a-upload-dragger
                v-else
                name="file"
                action=""
                :showUploadList="false"
                :customRequest="fileUpload"
              >
                <p class="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p class="ant-upload-text">Click or drag file to this area to upload</p>
              </a-upload-dragger>
              <a-checkbox v-model:checked="isAnalysisImg" @change="analysisChange"
                >解析图片信息</a-checkbox
              >
            </a-collapse-panel>
            <a-collapse-panel key="setting" header="设置">
              <div class="batch-size">
                <p>
                  图片数量<span>{{ batchSize }}</span>
                </p>
                <a-slider v-model:value="batchSize" :tooltipVisible="false" :min="1" :max="10" />
              </div>
              <div class="loras-select">
                <p>loras</p>
                <a-select
                  v-model:value="lorasList"
                  mode="multiple"
                  style="width: 100%"
                  placeholder="请选择"
                  :options="lorasSourceList"
                  @select="lorasSelect"
                  @deselect="lorasDesekect"
                />
              </div>
            </a-collapse-panel>
          </a-collapse>
          <div class="generate-div">
            <a-button type="primary" :disabled="isGenerating" block @click="generate">
              生成
            </a-button>
            <!-- <a-button type="primary" style="margin-top: 16px" block @click="testFn">
              测试
            </a-button> -->
          </div>
        </div>
      </a-layout-sider>
      <a-layout-content>
        <div class="show-content">
          <div v-for="(img, index) in showPicList" :key="index" class="show-item">
            <template v-if="img.imgSrc">
              <a-image :src="img.imgSrc" />
            </template>
            <div v-else class="placeholder-div">
              <a-spin :spinning="isGenerating">
                <img src="@/assets/logo.png" alt="" />
              </a-spin>
            </div>
          </div>
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { txt2img, img2img, progress, pngInfo, getLoras, testApi } from '@/service'
import { UploadOutlined, DeleteFilled } from '@ant-design/icons-vue'
const activeKey = ref('prompt')
// 关键词
const prompt = ref('beaty，young，glasses，sexy')
// 反向关键词
const negativePrompt = ref('')
// 图片文件转为base64
const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}
const uploadImg = ref('')
// 上传文件
const fileUpload = ({ file }) => {
  getBase64(file).then((fileBase64) => {
    uploadImg.value = fileBase64
    if (isAnalysisImg.value) {
      analysisImg()
    }
  })
  // uploadImg.value = URL.createObjectURL(file)
}
const deleteImg = () => {
  uploadImg.value = ''
}
// 是否解析图片信息
const isAnalysisImg = ref(false)
// 获取图片信息
const analysisImg = () => {
  pngInfo({ images: uploadImg.value }).then(({ data }) => {
    if (data.data.info) {
      prompt.value = data.data.info.Prompt
      negativePrompt.value = data.data.info.Negative_prompt
    }
  })
}
// 获取当前上传图片的信息
const analysisChange = () => {
  if (isAnalysisImg.value && uploadImg.value) {
    analysisImg()
  }
}
// 生成数量
const batchSize = ref(1)
// 是否在生成中
const isGenerating = ref(false)
// 百分比展示
const defaultPercent = ref(0)
// 图片地址列表
const srcList = ref([])
// 展示图片列表
const showPicList = computed(() => {
  let list = []
  for (let i = 0; i < batchSize.value; i++) {
    list.push({
      imgSrc: srcList.value[i] ?? ''
    })
  }
  return list
})

// 循环获取生成进度
const loopProgress = (taskId) => {
  isGenerating.value = true
  progress({
    taskId
  }).then(({ data }) => {
    defaultPercent.value = Number((Number(data.data.progress || 0) * 100).toFixed(0))
    if (defaultPercent.value == 100) {
      isGenerating.value = false
      srcList.value = data.data.urlList.map((item) => '/api' + item)
      return
    }
    setTimeout(() => {
      loopProgress(taskId)
    }, 5000)
  })
}
const generate = () => {
  const generateFn = uploadImg.value ? img2img : txt2img
  const generateParams = {
    steps: 32,
    width: 512,
    height: 512,
    prompt: prompt.value,
    negative_prompt: negativePrompt.value,
    batch_size: batchSize.value
  }
  if (uploadImg.value) {
    generateParams.images = uploadImg.value
  }
  generateFn(generateParams).then(({ data }) => {
    defaultPercent.value = 0
    loopProgress(data.data)
  })
}

const lorasList = ref([])
const lorasSourceList = ref([])
const getLorasList = () => {
  getLoras().then(({ data }) => {
    lorasSourceList.value = data.data.map((item) => {
      let { name, alias } = item
      return { label: name, value: alias }
    })
  })
}
const getLorasPrompt = (value) => {
  return `<lora:${value}:1>`
}
const lorasSelect = (value) => {
  prompt.value = prompt.value + ' ' + getLorasPrompt(value)
}
const lorasDesekect = (value) => {
  const re_extranet = /<([^:]+:[^:]+):[\d.]+>/
  const re_extranet_g = /\s+<([^:]+:[^:]+):[\d.]+>/g
  const text = getLorasPrompt(value)
  let m = text.match(re_extranet)
  let replaced = false
  let newPromptText
  if (m) {
    var partToSearch = m[1]
    newPromptText = prompt.value.replaceAll(re_extranet_g, function (found) {
      m = found.match(re_extranet)
      if (m[1] == partToSearch) {
        replaced = true
        return ''
      }
      return found
    })
  } else {
    newPromptText = prompt.value.replaceAll(new RegExp(text, 'g'), function (found) {
      if (found == text) {
        replaced = true
        return ''
      }
      return found
    })
  }
  if (replaced) {
    prompt.value = newPromptText
  }
}

onMounted(getLorasList)

const testFn = () => {
  testApi().then(({ data }) => {
    console.log('data: ', data)
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
      .aside-content {
        height: 100%;
        overflow: auto;
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
                // 图片上传
                .ant-upload {
                  .ant-upload-btn {
                    background-color: #fafafa;
                    .ant-upload-drag-icon {
                      margin-bottom: 16px;
                      .anticon-upload {
                        font-size: 28px;
                      }
                    }
                    .ant-upload-text {
                      font-size: 14px;
                      color: #666666;
                    }
                  }
                }
                // 上传完图片后的图片区域
                .uploaded-image {
                  padding: 8px;
                  height: 116px;
                  position: relative;
                  text-align: center;
                  border: 1px dashed #322f2f;
                  img {
                    width: 100px;
                    height: 100px;
                  }
                  .anticon-delete {
                    top: 8px;
                    right: 8px;
                    cursor: pointer;
                    color: #ffffff;
                    position: absolute;
                  }
                }
                .ant-checkbox-wrapper {
                  margin-top: 8px;
                  color: #ffffff;
                }
                // 图片数量
                .batch-size {
                  padding: 12px;
                  p {
                    color: #ffffff;
                    span {
                      float: right;
                      margin-right: 12px;
                    }
                  }
                }
                .loras-select {
                  padding: 12px;
                  p {
                    color: #ffffff;
                  }
                }
              }
            }
          }
        }
        .generate-div {
          padding: 12px;
        }
      }
    }
    .ant-layout-content {
      padding: 12px;
      .show-content {
        width: 100%;
        height: 100%;
        overflow: auto;
        .show-item {
          float: left;
          height: 512px;
          background: #ffffff;
          margin-top: 8px;
          margin-right: 8px;
          border-radius: 0.375rem;
          width: calc((100% - 24px) / 4);
          --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color),
            0 2px 4px -2px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000),
            var(--tw-shadow);
          &:nth-child(4n) {
            margin-right: 0;
          }
          .placeholder-div {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      }
    }
  }
}
</style>
