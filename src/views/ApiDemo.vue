<template>
  <div class="demo">
    <div class="card">
      <h2 class="sec-title">Axios 封装调用演示</h2>
      <p class="tip">
        本页通过 <code>@/utils/request</code>（统一封装的 axios
        实例）真实发起一次请求， 验证拦截器、错误提示等封装能力。
      </p>
      <div class="btns">
        <el-button type="primary" :loading="loading" @click="fetchPosts"
          >GET 请求示例</el-button
        >
        <el-button type="success" :loading="loading" @click="submitPost"
          >POST 请求示例</el-button
        >
        <el-button
          @click="
            result = ''
            err = ''
          "
          >清空结果</el-button
        >
      </div>
    </div>

    <div class="card" v-if="err">
      <el-alert :title="err" type="error" :closable="false" show-icon />
    </div>

    <div class="card" v-if="result">
      <h2 class="sec-title">响应结果</h2>
      <pre class="result-box">{{ result }}</pre>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'ApiDemo',
  data() {
    return { loading: false, result: '', err: '' }
  },
  methods: {
    async fetchPosts() {
      this.loading = true
      this.err = ''
      try {
        const data = await request({
          url: '/Login/MobileLogin',
          method: 'get',
          params: { account: 'system', password: 'lbj123321' },
        })
        this.result = JSON.stringify(data, null, 2)
      } catch (e) {
        this.err = e.message || String(e)
      } finally {
        this.loading = false
      }
    },
    async submitPost() {
      this.loading = true
      this.err = ''
      try {
        const data = await request({
          url: 'https://jsonplaceholder.typicode.com/posts',
          method: 'post',
          data: { title: '来自 H5 后台', body: 'axios 封装测试', userId: 1 },
        })
        this.result = JSON.stringify(data, null, 2)
      } catch (e) {
        this.err = e.message || String(e)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.sec-title {
  font-size: 16px;
  color: $header-bg;
  margin-bottom: 8px;
}
.tip {
  color: #666;
  line-height: 1.8;
  margin-bottom: 10px;
  code {
    background: #f0f2f5;
    padding: 1px 6px;
    border-radius: 4px;
  }
}
.btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.result-box {
  background: #2d3a4b;
  color: #a5e8a5;
  padding: 12px;
  border-radius: $radius;
  font-size: 12px;
  max-height: 320px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
