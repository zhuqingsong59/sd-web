<template>
  <a-modal
    v-model:visible="visible"
    width="100%"
    class="set-mask-dialog"
    :closable="false"
    :footer="null"
  >
    <div class="close-modal-icon" @click="hide"><CloseOutlined /></div>
    <div class="style-tip-message">点击图片中所有保持不变的区域</div>
    <div
      class="mask-img"
      :style="maskImgStyle"
      @mousemove="handleMouseMove($event)"
      @mouseleave="hoverMask = null"
      @click="handleClick($event)"
    >
      <img :src="image && image.src" />
      <img v-if="hoverMask" class="mask-image" :src="hoverMask.src" />
      <template v-if="maskImageList.length">
        <img
          :key="index"
          v-for="(image, index) in maskImageList"
          class="mask-image"
          :src="image.src"
        />
      </template>
    </div>
    <div class="style-opreate">
      <a-button value="small" shape="round" @click="getMask">确定</a-button>
    </div>
  </a-modal>
</template>
<script setup>
import npyjs from 'npyjs'
import { ref, watch } from 'vue'
import * as ort from 'onnxruntime-web'
import { mergeMask } from '@/service'
import { modelData } from '@/utils/onnxModelAPI'
import { InferenceSession } from 'onnxruntime-web'
import { onnxMaskToImage } from '@/utils/maskUtils'
import { CloseOutlined } from '@ant-design/icons-vue'

const emits = defineEmits(['get-mask'])

const visible = ref(false)
const hide = () => {
  visible.value = false
}

const image = ref(null)
const hoverMask = ref(null)
const maskImageList = ref([])
const modelScale = ref(null)
const model = ref(null)
const tensor = ref(null)
const clicks = ref(null)
const maskImgStyle = ref(null)
const baseUrl = import.meta.env.MODE === 'development' ? '/api' : ''
let IMAGE_PATH, MODEL_DIR
MODEL_DIR = baseUrl + '/static/onnx/vit_h.onnx'

// Initialize the ONNX model
const initModel = async () => {
  try {
    if (MODEL_DIR === undefined) return
    const URL = MODEL_DIR
    const modelValue = await InferenceSession.create(URL)
    model.value = modelValue
  } catch (e) {
    console.log(e)
  }
}
initModel()
const handleImageScale = (image) => {
  // Input images to SAM must be resized so the longest side is 1024
  const LONG_SIDE_LENGTH = 1024
  let w = image.naturalWidth
  let h = image.naturalHeight
  const samScale = LONG_SIDE_LENGTH / Math.max(h, w)
  return { height: h, width: w, samScale }
}
const loadImage = async (url) => {
  try {
    const img = new Image()
    img.src = url.href
    img.onload = () => {
      const { height, width, samScale } = handleImageScale(img)
      modelScale.value = {
        height,
        width,
        samScale
      }
      maskImgStyle.value = {
        height: height + 'px',
        width: width + 'px'
      }
      img.width = width
      img.height = height
      image.value = img
    }
  } catch (error) {
    console.log(error)
  }
}

// Load the Segment Anything pre-computed embedding
// Decode a Numpy file into a tensor.
const loadNpyTensor = async (tensorFile, dType) => {
  let npLoader = new npyjs()
  const npArray = await npLoader.load(tensorFile)
  const tensor = new ort.Tensor(dType, npArray.data, npArray.shape)
  return tensor
}

const getClick = (x, y) => {
  const clickType = 1
  return { x, y, clickType }
}
const handleMouseMove = (e) => {
  let el = e.target
  const rect = el.getBoundingClientRect()
  let x = e.clientX - rect.left
  let y = e.clientY - rect.top
  const imageScale = image.value ? image.value.width / el.offsetWidth : 1
  x *= imageScale
  y *= imageScale
  const click = getClick(x, y)
  if (click) {
    clicks.value = [click]
  }
}
let isClick = false
const handleClick = (e) => {
  let el = e.target
  const rect = el.getBoundingClientRect()
  let x = e.clientX - rect.left
  let y = e.clientY - rect.top
  const imageScale = image.value ? image.value.width / el.offsetWidth : 1
  x *= imageScale
  y *= imageScale
  const click = getClick(x, y)
  if (click) {
    clicks.value = [click]
    isClick = true
  }
}

const runONNX = async () => {
  try {
    if (
      model.value === null ||
      clicks.value === null ||
      tensor.value === null ||
      modelScale.value === null
    )
      return
    else {
      // Preapre the model input in the correct format for SAM.
      // The modelData function is from onnxModelAPI.tsx.
      const feeds = modelData({
        clicks: clicks.value,
        tensor: tensor.value,
        modelScale: modelScale.value
      })
      if (feeds === undefined) return
      // Run the SAM ONNX model with the feeds returned from modelData()
      const results = await model.value.run(feeds)
      const output = results[model.value.outputNames[0]]
      // The predicted mask returned from the ONNX model is an array which is
      // rendered as an HTML image using onnxMaskToImage() from maskUtils.tsx.
      if (isClick) {
        const mask = onnxMaskToImage(output.data, output.dims[2], output.dims[3])
        if (!maskImageList.value.some((listItem) => listItem.src === mask.src)) {
          maskImageList.value.push(mask)
        }
        isClick = false
      } else {
        hoverMask.value = onnxMaskToImage(output.data, output.dims[2], output.dims[3])
      }
    }
  } catch (e) {
    console.log(e)
  }
}

const loadTensor = (IMAGE_EMBEDDING) => {
  Promise.resolve(loadNpyTensor(baseUrl + IMAGE_EMBEDDING, 'float32')).then(
    (embedding) => (tensor.value = embedding)
  )
}

const show = (option) => {
  maskImgStyle.value = null
  hoverMask.value = null
  image.value = null
  maskImageList.value = []

  IMAGE_PATH = baseUrl + option.image
  const url = new URL(IMAGE_PATH, location.origin)
  loadImage(url)
  visible.value = true
}

const getMask = () => {
  if (!maskImageList.value.length) return
  if (maskImageList.value.length > 1) {
    mergeMask({
      mask_list: maskImageList.value.map((item) => item.src)
    }).then(({ data }) => {
      emits('get-mask', data.data)
      visible.value = false
    })
  } else {
    emits('get-mask', maskImageList.value[0].src)
    visible.value = false
  }
}

watch(clicks, () => {
  runONNX()
})

defineExpose({
  show,
  loadTensor
})
</script>
<style lang="scss">
.set-mask-dialog {
  top: 0;
  padding: 0;
  height: 100%;
  max-width: 100%;
  .ant-modal-content {
    display: flex;
    height: 100vh;
    align-items: center;
    background: hsla(0, 0%, 8%, 0) !important;
    .ant-modal-body {
      padding: 0;
      width: 100%;
      height: auto;
      .close-modal-icon {
        top: 20px;
        right: 20px;
        z-index: 1002;
        display: flex;
        font-size: 32px;
        cursor: pointer;
        position: fixed;
        color: #ffffff;
        border-radius: 50%;
        align-items: center;
        justify-content: center;
      }
      .style-tip-message {
        color: #ffffff;
        text-align: center;
        margin: 20px auto;
        width: 100%;
      }
      .mask-img {
        background: #ffffff;
        position: relative;
        margin: 0 auto;
        img {
          height: 100%;
        }
        .mask-image {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          opacity: 0.4;
        }
      }
      .style-opreate {
        margin-top: 20px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}
</style>
