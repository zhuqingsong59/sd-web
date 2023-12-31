import axios from 'axios'
const baseUrl = import.meta.env.VITE_SERVER_URL || '/api'
// 测试接口返回数据专用
export const testApi = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/testApi',
    data: params
  })
}
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
// 获取图片信息
export const pngInfo = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/pngInfo',
    data: params
  })
}
// 获取loras
export const getLoras = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/getLoras',
    data: params
  })
}
// 获取models
export const getModelsNames = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/getModelsNames',
    data: params
  })
}
// 获取当前model
export const getCurrentModel = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/getCurrentModel',
    data: params
  })
}
// 设置当前model
export const setCurrentModel = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/setCurrentModel',
    data: params
  })
}
// 文本翻译
export const translate = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/translate',
    data: params
  })
}

// 获取预处理器列表
export const getModelList = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/getModelList',
    data: params
  })
}
// 获取模型列表
export const getModuleList = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/getModuleList',
    data: params
  })
}
// 获取预览图
export const getDetect = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/getDetect',
    data: params
  })
}
// 获取色块图
export const segment = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/segment',
    data: params
  })
}
// 获取覆盖图
export const mask = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/mask',
    data: params
  })
}
// 获取覆盖图
export const segmentAnything = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/segmentAnything',
    data: params
  })
}
// 合并mask
export const mergeMask = (params) => {
  return axios({
    method: 'post',
    url: baseUrl + '/mergeMask',
    data: params
  })
}
