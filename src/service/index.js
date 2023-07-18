import axios from 'axios'
// 文本转图片
export const txt2img = (params) => {
  return axios({
    method: 'post',
    url: '/api/txt2img',
    data: params
  })
}

export const progress = (params) => {
  return axios({
    method: 'post',
    url: '/api/progress',
    data: params
  })
}
