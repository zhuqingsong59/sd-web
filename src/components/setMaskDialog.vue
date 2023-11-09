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
    <div class="mask-img" :style="maskImgStyle" @mousemove="handleMouseMove($event)">
      <img :src="image && image.src" />
      <img v-if="maskImage" class="mask-image" :src="maskImage.src" />
    </div>
    <div class="style-opreate">
      <a-button value="small" shape="round">确定</a-button>
    </div>
  </a-modal>
</template>
<script setup>
import { ref, watch } from 'vue'
import npyjs from 'npyjs'
import * as _ from 'underscore'
import * as ort from 'onnxruntime-web'
import { modelData } from '@/utils/onnxModelAPI'
import { InferenceSession } from 'onnxruntime-web'
import { onnxMaskToImage } from '@/utils/maskUtils'
import { CloseOutlined } from '@ant-design/icons-vue'

const visible = ref(false)
const hide = () => {
  visible.value = false
}

const image = ref(null)
const maskImage = ref(null)
const modelScale = ref(null)
const model = ref(null)
const tensor = ref(null)
const clicks = ref(null)
const maskImgStyle = ref({})
const baseUrl = import.meta.env.MODE === 'development' ? '/api' : ''
const IMAGE_PATH = baseUrl + '/static/data/202.png'
const IMAGE_EMBEDDING = baseUrl + '/static/data/202.npy'
const MODEL_DIR = baseUrl + '/static/data/test.onnx'

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
      console.log('maskImgStyle.value: ', maskImgStyle.value)
      img.width = width
      img.height = height
      image.value = img
    }
  } catch (error) {
    console.log(error)
  }
}
const url = new URL(IMAGE_PATH, location.origin)
loadImage(url)

// Load the Segment Anything pre-computed embedding
// Decode a Numpy file into a tensor.
const loadNpyTensor = async (tensorFile, dType) => {
  let npLoader = new npyjs()
  const npArray = await npLoader.load(tensorFile)
  const tensor = new ort.Tensor(dType, npArray.data, npArray.shape)
  return tensor
}
Promise.resolve(loadNpyTensor(IMAGE_EMBEDDING, 'float32')).then(
  (embedding) => (tensor.value = embedding)
)

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
      maskImage.value = onnxMaskToImage(output.data, output.dims[2], output.dims[3])
    }
  } catch (e) {
    console.log(e)
  }
}

watch(clicks, () => {
  runONNX()
})

defineExpose({
  show: () => {
    visible.value = true
  }
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
