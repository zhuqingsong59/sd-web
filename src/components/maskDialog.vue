<template>
  <a-modal
    v-model:visible="visible"
    title="创建遮罩"
    width="1200px"
    class="mask-dialog"
    @ok="handleOk"
  >
    <div>
      <div class="source-content">
        <div class="source-image" v-if="sourceImg">
          <img ref="sourceImgRef" :src="sourceImg" />
          <!-- <DeleteFilled @click="deleteImg" /> -->
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
      </div>
      <a-button type="primary" style="margin-top: 16px" block @click="createFn">创建</a-button>
    </div>
    <div class="result-image">
      <div>
        <img ref="segmentImgRef" draggable="false" :src="segmentImg" @load="segmentImgLoaded" />
        <canvas id="segmentCanvas"></canvas>
      </div>
      <a-button type="primary" style="margin-top: 16px" block @click="getFn">获取</a-button>
      <div>
        <img :src="resultImg" />
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { segment, mask } from '@/service'
import { UploadOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
const visible = ref(false)

// 图片文件转为base64
const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}
const sourceImg = ref('')
const sourceImgRef = ref()
// 上传文件
const imgUpload = ({ file }) => {
  getBase64(file).then((fileBase64) => {
    sourceImg.value = fileBase64
  })
}
const segmentImg = ref('')
const segmentImgRef = ref()
const createFn = () => {
  segment({ images: sourceImg.value }).then(({ data }) => {
    segmentImg.value = '/api' + data.data
  })
}

let canvas
const segmentImgLoaded = () => {
  canvas = document.getElementById('segmentCanvas')
  canvas.width = segmentImgRef.value.width
  canvas.height = segmentImgRef.value.height
  let ctx = canvas.getContext('2d')
  let isDrawing = false
  let lastX = 0
  let lastY = 0
  canvas.addEventListener('mousedown', function (e) {
    isDrawing = true
    ;[lastX, lastY] = [e.offsetX, e.offsetY]
  })
  canvas.addEventListener('mousemove', function (e) {
    if (isDrawing) {
      ctx.beginPath()
      ctx.moveTo(lastX, lastY)
      ctx.lineTo(e.offsetX, e.offsetY)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()
      ;[lastX, lastY] = [e.offsetX, e.offsetY]
    }
  })

  canvas.addEventListener('mouseleave', function () {
    isDrawing = false
  })
  canvas.addEventListener('mouseup', function () {
    isDrawing = false
  })
}

const resultImg = ref('')
const getFn = () => {
  // let dataURL = canvas.toDataURL('image/png')
  const scaledCanvas = document.createElement('canvas')
  const scaledCtx = scaledCanvas.getContext('2d')
  const targetWidth = sourceImgRef.value.naturalWidth
  const targetHeight = sourceImgRef.value.naturalHeight

  scaledCanvas.width = targetWidth
  scaledCanvas.height = targetHeight
  scaledCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight)

  const imageData = scaledCtx.getImageData(0, 0, targetWidth, targetHeight)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    if (a === 0) {
      // 将透明背景转换为黑色
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 255 // 不透明
    } else if (r === 0 && g === 0 && b === 0) {
      // 将黑色线条转换为白色
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = 255 // 不透明
    }
  }
  scaledCtx.putImageData(imageData, 0, 0)
  mask({
    images: sourceImg.value,
    sketch_image: scaledCanvas.toDataURL('image/png')
  }).then(({ data }) => {
    resultImg.value = '/api' + data.data
  })
}
const handleOk = () => {}

defineExpose({
  show: () => {
    visible.value = true
  }
})
</script>
<style lang="scss">
.mask-dialog {
  .ant-modal-content {
    .ant-modal-body {
      height: 500px;
      display: flex;
      & > div {
        width: 50%;
        height: 100%;
        &:first-child {
          padding-right: 8px;
        }
        &:last-child {
          padding-left: 8px;
        }
        .source-content {
          height: calc(100% - 48px);
          .ant-upload-drag {
            .ant-upload-drag-icon {
              margin-top: 100px;
            }
          }
          .source-image {
            height: 100%;
            text-align: center;
            img {
              height: 100%;
              max-width: 100%;
            }
          }
        }
        &.result-image {
          & > div {
            text-align: center;
            border: 1px dashed #d9d9d9;
            height: calc((100% - 64px) / 2);
            position: relative;
            img {
              position: absolute;
              height: 100%;
              left: 50%;
              z-index: 1;
              transform: translateX(-50%);
            }
            canvas {
              z-index: 2;
              position: relative;
            }
          }
          .ant-btn-block {
            margin-bottom: 16px;
          }
        }
      }
    }
  }
}
</style>
