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
          <img :src="sourceImg" />
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
        <img :src="segmentImg" />
      </div>
      <a-button type="primary" style="margin-top: 16px" block>获取</a-button>
      <div></div>
    </div>
  </a-modal>
</template>

<script setup>
import { segment } from '@/service'
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
// 上传文件
const imgUpload = ({ file }) => {
  getBase64(file).then((fileBase64) => {
    sourceImg.value = fileBase64
  })
}
const segmentImg = ref('')
const createFn = () => {
  segment({ images: sourceImg.value }).then(({ data }) => {
    console.log(data)
    segmentImg.value = '/api' + data.data
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
            }
          }
        }
        &.result-image {
          & > div {
            text-align: center;
            border: 1px dashed #d9d9d9;
            height: calc((100% - 64px) / 2);
            img {
              height: 100%;
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
