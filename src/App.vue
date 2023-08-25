<template>
  <a-layout>
    <a-layout-header>xishui.ai</a-layout-header>
    <a-layout>
      <a-layout-sider width="400">
        <div class="aside-content">
          <a-collapse v-model:activeKey="activeKey">
            <a-collapse-panel key="prompt" header="提示词">
              <a-button class="translate-btn" type="text" @click="translateFn()">一键翻译</a-button>
              <a-textarea
                v-model:value="prompt"
                placeholder="提示词，请输入英文，或者输入中文后点击一键翻译"
                allow-clear
                :autoSize="{ minRows: 4 }"
              />
            </a-collapse-panel>
            <a-collapse-panel key="negativePrompt" header="反向提示词">
              <a-button class="translate-btn" type="text" @click="translateFn(true)">
                一键翻译
              </a-button>
              <a-textarea
                v-model:value="negativePrompt"
                placeholder="反向提示词，请输入英文，或者输入中文后点击一键翻译"
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
                :customRequest="imgUpload"
              >
                <p class="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p class="ant-upload-text">点击上传或者拖拽文件到此处</p>
              </a-upload-dragger>
              <a-checkbox v-model:checked="isAnalysisImg" @change="analysisChange"
                >解析图片信息</a-checkbox
              >
            </a-collapse-panel>
            <a-collapse-panel key="setting" header="设置">
              <div class="div-slider">
                <p>
                  图片比例<span class="center">{{ scaleList[picScale - 1].scale }}</span>
                </p>
                <a-slider
                  v-model:value="picScale"
                  :tooltipVisible="false"
                  :min="1"
                  :max="9"
                  @change="scaleChange"
                />
              </div>
              <div class="div-slider">
                <p>
                  图片数量<span class="right">{{ batchSize }}</span>
                </p>
                <a-slider v-model:value="batchSize" :tooltipVisible="false" :min="1" :max="10" />
              </div>
              <div class="div-select">
                <p>Stable Diffusion 模型(ckpt)</p>
                <a-select
                  v-model:value="currentModel"
                  style="width: 100%"
                  placeholder="请选择"
                  :options="sdModelsList"
                  @change="modelChange"
                />
              </div>
              <div class="div-select">
                <p>lora</p>
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
              <div class="advanced">
                <p>
                  <EyeOutlined v-if="hideAdvanced" @click="hideAdvanced = !hideAdvanced" />
                  <EyeInvisibleOutlined v-else @click="hideAdvanced = !hideAdvanced" />
                  高级设置
                </p>
                <div class="advanced-setting" v-show="!hideAdvanced">
                  <div class="advanced-item">
                    <p>宽度</p>
                    <input type="text" v-model="advancedSetting.width" />
                  </div>
                  <div class="advanced-item">
                    <p>高度</p>
                    <input type="text" v-model="advancedSetting.height" />
                  </div>
                  <div class="advanced-item">
                    <p>采样迭代步数</p>
                    <input type="text" v-model="advancedSetting.steps" />
                  </div>
                  <div class="advanced-item">
                    <p>随机数种子</p>
                    <input type="text" placeholder="auto" v-model="advancedSetting.seed" />
                  </div>
                </div>
              </div>
            </a-collapse-panel>
            <a-collapse-panel key="controlnet" header="ControlNet">
              <div
                class="uploaded-image"
                :class="{ 'half-width': allowPreview }"
                v-if="controlnetImg"
              >
                <img :src="controlnetImg" />
                <DeleteFilled @click="deleteControlnetImg" />
              </div>
              <a-upload-dragger
                v-else
                :class="{ 'half-width': allowPreview }"
                name="file"
                action=""
                :showUploadList="false"
                :customRequest="controlnetUpload"
              >
                <p class="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p class="ant-upload-text">点击上传或者拖拽文件到此处</p>
              </a-upload-dragger>
              <div class="preview-image" v-if="allowPreview">
                <a-image :width="100" :height="100" :src="previewImg" alt="预览图" />
              </div>
              <a-checkbox v-model:checked="controlnetEnable">启用</a-checkbox>
              <a-checkbox v-model:checked="allowPreview">允许预览</a-checkbox>
              <a-checkbox v-model:checked="lowVRAM">低显存优化</a-checkbox>
              <!-- <a-checkbox v-model:checked="pixelPerfect">像素</a-checkbox> -->
              <div class="div-select">
                <p>预处理器<span v-show="allowPreview" @click="preview">预览</span></p>
                <a-select
                  v-model:value="controlnetModule"
                  style="width: 100%"
                  placeholder="请选择"
                  :options="controlnetModuleList"
                />
              </div>
              <div class="div-select controlnet-model-select">
                <p>模型</p>
                <a-select
                  v-model:value="controlnetModel"
                  style="width: 100%"
                  placeholder="请选择"
                  :options="controlnetModelList"
                />
              </div>
              <div class="div-slider">
                <p>
                  控制权重
                  <span class="right">
                    <a-input-number
                      size="small"
                      v-model:value="controlWeight"
                      :min="0"
                      :max="2"
                      :step="0.01"
                    />
                  </span>
                </p>
                <a-slider
                  v-model:value="controlWeight"
                  :step="0.01"
                  :tooltipVisible="false"
                  :min="0"
                  :max="2"
                />
              </div>
              <div class="div-slider">
                <p>
                  起始步数
                  <span class="right">
                    <a-input-number
                      size="small"
                      v-model:value="startingStep"
                      :min="0"
                      :max="2"
                      :step="0.01"
                    />
                  </span>
                </p>
                <a-slider
                  v-model:value="startingStep"
                  :step="0.01"
                  :tooltipVisible="false"
                  :min="0"
                  :max="2"
                />
              </div>
              <div class="div-slider">
                <p>
                  完结步数
                  <span class="right">
                    <a-input-number
                      size="small"
                      v-model:value="endingStep"
                      :min="0"
                      :max="2"
                      :step="0.01"
                    />
                  </span>
                </p>
                <a-slider
                  v-model:value="endingStep"
                  :step="0.01"
                  :tooltipVisible="false"
                  :min="0"
                  :max="2"
                />
              </div>
              <div class="div-radio">
                <p>控制模式</p>
                <a-radio-group v-model:value="controlModel">
                  <a-radio :value="0">均衡</a-radio>
                  <a-radio :value="1">注重提示词</a-radio>
                  <a-radio :value="2">注重ControlNet</a-radio>
                </a-radio-group>
              </div>
              <div class="div-radio">
                <p>图片缩放模式</p>
                <a-radio-group v-model:value="resizeMode">
                  <a-radio value="Just Resize">拉升</a-radio>
                  <a-radio value="Crop and Resize">裁剪</a-radio>
                  <a-radio value="Resize and Fill">填充</a-radio>
                </a-radio-group>
              </div>
            </a-collapse-panel>
          </a-collapse>
          <div class="generate-div">
            <a-button
              type="primary"
              :disabled="isGenerating || isChangeMode"
              block
              @click="generate"
            >
              生成
            </a-button>
            <a-button type="primary" style="margin-top: 16px" block @click="creatMask">
              创建遮罩
            </a-button>
            <!-- <a-button type="primary" style="margin-top: 16px" block @click="testFn">
              测试
            </a-button> -->
          </div>
        </div>
      </a-layout-sider>
      <a-layout-content>
        <div class="show-content">
          <div
            v-for="(img, index) in showPicList"
            :key="index"
            class="show-item"
            :style="computedStyle"
          >
            <template v-if="img.imgSrc">
              <a-image :src="img.imgSrc" />
            </template>
            <div v-else class="placeholder-div">
              <a-spin :spinning="isGenerating">
                <img src="@/assets/logo.png" alt="" />
              </a-spin>
            </div>
            <div class="pic-operate" v-show="img.imgSrc">
              <PictureOutlined @click="setImg(img.imgSrc)" />
              <EditOutlined @click="editImg(img.imgSrc)" />
              <DownloadOutlined @click="download(img.imgSrc)" />
            </div>
          </div>
        </div>
        <a-modal v-model:visible="modalVisible" :width="560" title="图片绘制" @ok="ok">
          <canvas id="modalCanvas"></canvas>
        </a-modal>
        <maskDialog ref="maskDialogRef" />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import {
  txt2img,
  img2img,
  progress,
  pngInfo,
  getLoras,
  translate,
  getModelsNames,
  getCurrentModel,
  setCurrentModel,
  getModelList,
  getModuleList,
  getDetect
  // testApi
} from '@/service'
import { message } from 'ant-design-vue'
import 'ant-design-vue/es/message/style/css'
import maskDialog from './components/maskDialog.vue'
import { ref, computed, onMounted, reactive, watch, nextTick } from 'vue'
import {
  EyeOutlined,
  DeleteFilled,
  EditOutlined,
  UploadOutlined,
  PictureOutlined,
  DownloadOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons-vue'
const activeKey = ref(['prompt'])
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

// 翻译
const translateFn = (isNegative) => {
  translate({
    textList: isNegative ? negativePrompt.value : prompt.value
  }).then(({ data }) => {
    if (isNegative) {
      negativePrompt.value = data.data.translated_text
    } else {
      prompt.value = data.data.translated_text
    }
  })
}
const uploadImg = ref('')
// 上传文件
const imgUpload = ({ file }) => {
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

// 图片比例
const picScale = ref(5)
// 比例换算对应
const scaleList = [
  { scale: '21 : 9', size: '1536 x 640' },
  { scale: '16 : 9', size: '1344 x 768' },
  { scale: '3 : 2', size: '1216 x 832' },
  { scale: '5 : 4', size: '1152 x 896' },
  { scale: '1 : 1', size: '1024 x 1024' },
  { scale: '4 : 5', size: '890 x 1152' },
  { scale: '2 : 3', size: '832 x 1216' },
  { scale: '9 : 16', size: '768 x 1344' },
  { scale: '9 : 21', size: '640 x 1536' }
]
const scaleChange = () => {
  const [width, height] = scaleList[picScale.value - 1].size.split(' x ')
  advancedSetting.width = width
  advancedSetting.height = height
}
// 生成数量
const batchSize = ref(1)
// 是否在生成中
const isGenerating = ref(false)
// 百分比展示
const defaultPercent = ref(0)
// 隐藏高级设置
const hideAdvanced = ref(true)
const advancedSetting = reactive({
  width: '512',
  height: '512',
  steps: '30',
  seed: ''
})

watch(advancedSetting, () => {
  computedStyleFn()
})
const computedStyle = ref({})
const computedStyleFn = () => {
  let height
  let showItem = document.querySelector('.show-item')
  const itemWidth = showItem
    ? getComputedStyle(document.querySelector('.show-item'))?.width.replace('px', '')
    : ''
  if (!itemWidth) {
    computedStyle.value = {}
  }
  height = (
    (Number(itemWidth) * Number(advancedSetting.height)) /
    Number(advancedSetting.width)
  ).toFixed(0)
  computedStyle.value = { height: height + 'px' }
}
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
  if (controlnetEnable.value) {
    if (!controlnetImg.value) {
      message.error('请先上传图片')
      return
    }
    if (controlnetModule.value === 'none') {
      message.error('请选择预处理器')
      return
    }
    if (controlnetModel.value === 'none') {
      message.error('请选择模型')
      return
    }
  }
  const generateFn = uploadImg.value ? img2img : txt2img
  const generateParams = {
    steps: advancedSetting.steps,
    width: advancedSetting.width,
    height: advancedSetting.height,
    prompt: prompt.value,
    negative_prompt: negativePrompt.value,
    batch_size: batchSize.value
  }
  if (uploadImg.value) {
    generateParams.images = uploadImg.value
  }
  if (controlnetEnable.value) {
    generateParams.controlnet_units = {
      input_image: controlnetImg.value,
      module: controlnetModule.value,
      model: controlnetModel.value,
      weight: controlWeight.value,
      lowvram: lowVRAM.value,
      guidance_start: startingStep.value,
      guidance_end: endingStep.value,
      control_mode: controlModel.value,
      resize_mode: resizeMode.value
    }
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
  prompt.value = prompt.value + '，' + getLorasPrompt(value)
}
const lorasDesekect = (value) => {
  const re_extranet = /<([^:]+:[^:]+):[\d.]+>/
  const re_extranet_g = /，+<([^:]+:[^:]+):[\d.]+>/g
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

// 主模型相关
const sdModelsList = ref([])
const currentModel = ref('')
const getSdModelsList = () => {
  getModelsNames().then(({ data }) => {
    sdModelsList.value = data.data.map((item) => {
      return {
        label: item,
        value: item
      }
    })
    getCurrentModel().then(({ data }) => {
      currentModel.value = data.data
    })
  })
}
const isChangeMode = ref(false)
const modelChange = (modelName) => {
  isChangeMode.value = true
  setCurrentModel({
    modelName
  }).then(() => {
    isChangeMode.value = false
    message.success('model切换成功')
  })
}

const controlnetImg = ref('')
const controlnetUpload = ({ file }) => {
  getBase64(file).then((fileBase64) => {
    controlnetImg.value = fileBase64
  })
}
const deleteControlnetImg = () => {
  controlnetImg.value = ''
}
const controlnetEnable = ref(false)
const allowPreview = ref(false)
const lowVRAM = ref(false)
const previewImg = ref('')
const controlnetModule = ref('none')
const controlnetModuleList = ref([])
const controlnetModel = ref('none')
const controlnetModelList = ref([])
const getControlnetModuleList = () => {
  getModuleList().then(({ data }) => {
    controlnetModuleList.value = data.data.map((item) => {
      return {
        label: item,
        value: item
      }
    })
  })
}
const getControlnetModelList = () => {
  getModelList().then(({ data }) => {
    controlnetModelList.value = [
      { label: 'none', value: 'none' },
      ...data.data.map((item) => {
        return {
          label: item,
          value: item
        }
      })
    ]
  })
}
const preview = () => {
  if (!controlnetImg.value) {
    message.error('请先上传图片')
    return
  }
  if (controlnetModule.value === 'none') {
    message.error('请选择预处理器')
    return
  }
  getDetect({
    module: controlnetModule.value,
    images: controlnetImg.value
  }).then(({ data }) => {
    previewImg.value = 'data:image/png;base64,' + data.data
  })
}

const controlWeight = ref(1)
const startingStep = ref(0)
const endingStep = ref(1)
const controlModel = ref(0)
const resizeMode = ref('Just Resize')

onMounted(() => {
  getLorasList()
  getSdModelsList()
  getControlnetModuleList()
  getControlnetModelList()
  nextTick(() => {
    computedStyleFn()
  })
})

const setImg = (url) => {
  fetch(url)
    .then((r) => r.blob())
    .then((blob) => {
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = () => {
        uploadImg.value = reader.result
        if (!activeKey.value.includes('uploadImage')) {
          activeKey.value = [...activeKey.value, 'uploadImage']
        }
      }
    })
}
const download = (url) => {
  fetch(url)
    .then((r) => r.blob())
    .then((blob) => {
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = () => {
        const imgUrl = reader.result
        if (window.navigator.msSaveOrOpenBlob) {
          var bstr = atob(imgUrl.split(',')[1])
          var n = bstr.length
          var u8arr = new Uint8Array(n)
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
          }
          var blob = new Blob([u8arr])
          window.navigator.msSaveOrOpenBlob(blob, 'download' + '.' + 'png')
        } else {
          // 这里就按照chrome等新版浏览器来处理
          const a = document.createElement('a')
          a.href = imgUrl
          a.setAttribute('download', 'download')
          a.click()
        }
      }
    })
}
const modalVisible = ref(false)
let canvas
const editImg = (url) => {
  modalVisible.value = true
  nextTick(() => {
    canvas = document.getElementById('modalCanvas')
    canvas.width = advancedSetting.width
    canvas.height = advancedSetting.height
    let ctx = canvas.getContext('2d')
    let img = new Image()
    let isDrawing = false
    let lastX = 0
    let lastY = 0
    canvas.addEventListener('mousedown', function (e) {
      isDrawing = true
      ;[lastX, lastY] = [e.offsetX, e.offsetY]
    })

    canvas.addEventListener('mouseleave', function () {
      isDrawing = false
    })

    canvas.addEventListener('mousemove', function (e) {
      if (isDrawing) {
        ctx.beginPath()
        ctx.moveTo(lastX, lastY)
        ctx.lineTo(e.offsetX, e.offsetY)
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 20
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.stroke()
        ;[lastX, lastY] = [e.offsetX, e.offsetY]
      }
    })

    canvas.addEventListener('mouseup', function () {
      isDrawing = false
    })
    img.onload = function () {
      ctx.drawImage(img, 0, 0)
    }
    img.src = url
  })
}
const ok = () => {
  let dataURL = canvas.toDataURL('image/png')
  uploadImg.value = dataURL
  if (!activeKey.value.includes('uploadImage')) {
    activeKey.value = [...activeKey.value, 'uploadImage']
  }
  modalVisible.value = false
}
// const testFn = () => {
//   testApi().then(({ data }) => {
//     console.log('data: ', data)
//   })
// }
const maskDialogRef = ref()
const creatMask = () => {
  maskDialogRef.value.show()
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
            position: relative;
            .ant-collapse-header {
              color: #ffffff;
              user-select: none;
            }
            .ant-collapse-content {
              border-top: none;
              .ant-collapse-content-box {
                padding: 12px;
                position: relative;
                background: #001529;
                .translate-btn {
                  position: absolute;
                  color: #ffffff;
                  top: -35px;
                  right: 16px;
                  height: 22px;
                  padding: 0;
                }
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
                  user-select: none;
                }
                .div-slider {
                  padding: 12px;
                  p {
                    color: #ffffff;
                    position: relative;
                    .center {
                      position: absolute;
                      left: 50%;
                      transform: translateX(-50%);
                    }
                    .right {
                      float: right;
                      margin-right: 12px;
                    }
                  }
                }
                .div-select {
                  padding: 12px;
                  p {
                    color: #ffffff;
                    span {
                      float: right;
                      cursor: pointer;
                    }
                  }
                }
                .div-radio {
                  padding: 12px;
                  p,
                  .ant-radio-wrapper {
                    color: #ffffff;
                  }
                }
                // 高级设置
                .advanced {
                  padding: 12px;
                  p {
                    color: #ffffff;
                    margin-bottom: 0;
                    user-select: none;
                  }
                  .advanced-setting {
                    padding: 12px 0;
                    height: 100px;
                    .advanced-item {
                      float: left;
                      width: 50%;
                      height: 50px;
                      p {
                        height: 25px;
                        color: #ffffff;
                        opacity: 0.7;
                        padding-left: 4px;
                        line-height: 25px;
                      }
                      input {
                        height: 25px;
                        border: none;
                        color: #ffffff;
                        line-height: 25px;
                        background: #001529;
                        &:focus-visible,
                        &:hover {
                          border-radius: 2px;
                          outline-offset: 2px;
                          outline: 2px solid transparent;
                          border: 1px solid rgb(229, 231, 235);
                        }
                      }
                    }
                  }
                }

                .half-width {
                  width: 50%;
                }
                .preview-image {
                  top: 12px;
                  display: flex;
                  right: 12px;
                  height: 128px;
                  position: absolute;
                  left: calc(50% + 8px);
                  background-color: #ffffff;
                  justify-content: center;
                  align-items: center;
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
          position: relative;
          background: #ffffff;
          margin-top: 8px;
          margin-right: 8px;
          padding: 8px;
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
          .ant-image {
            width: 100%;
            height: 100%;
          }
          .pic-operate {
            top: 8px;
            right: 8px;
            color: #ffffff;
            position: absolute;
            span {
              margin-left: 12px;
              font-size: 18px;
              cursor: pointer;
              opacity: 0;
            }
          }
          &:hover {
            .pic-operate span {
              opacity: 1;
            }
          }
        }
      }
    }
  }
}
</style>
