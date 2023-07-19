import axios from 'axios'
const baseUrl = '/api'
// 文本转图片
export const txt2img = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/txt2img',
    data: params
  })
}
// 图片转图片
export const img2img = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/img2img',
    data: params
  })
}
// 获取生成进度
export const progress = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/progress',
    data: params
  })
}
