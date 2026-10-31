# H5 后台管理系统（Vue2 全家桶）

基于 **Vue 2.7 + Webpack 5** 手工搭建的 H5 项目：全家桶齐全、**三环境配置管理**、**接口集中管理**，打包产物为可直接双击打开的单文件 `index.html`。

## 技术栈

| 能力 | 方案 |
| --- | --- |
| 框架 | Vue 2.7（`vue` + `vue-template-compiler`） |
| 路由 | Vue Router 3（**hash 模式**，file:// 下可用） |
| UI 组件库 | ElementUI 2.15（全量引入，可按需改造） |
| HTTP | Axios 统一封装：拦截器 / token / 错误提示 / loading / **重复请求自动取消** / 接口日志开关 |
| 多环境 | `.env.development / .env.test / .env.production`，构建时注入，含 **devServer 接口代理** |
| 接口管理 | **注册表驱动**（`src/api/definitions.js` 单一数据源）+ 自动生成调用函数 + **系统配置页在线测试** |
| CSS 预处理 | Sass（SCSS）与 Less 双接入，SCSS 全局变量自动注入 |
| 开发体验 | webpack-dev-server：**HMR 热更新**、自动打开浏览器、错误遮罩 |
| 打包产物 | **自包含单文件 `index.html`**（JS/CSS 注入、图片字体转 base64），双击即可用浏览器打开 |

## 目录结构

```
├── .env.development         # 开发环境（接口前缀 /api、代理目标、开关）
├── .env.test                # 测试环境（测试服地址、vConsole 等）
├── .env.production          # 生产环境（正式接口地址、日志关闭）
├── babel.config.js          # Babel（兼容移动端 WebView）
├── config/
│   ├── load-env.js          # 环境文件加载 + DefinePlugin（逐键注入）
│   ├── webpack.common.js    # 公共配置（入口 / 别名 / vue-loader / 静态资源）
│   ├── webpack.dev.js       # 开发配置（HMR 热更新 + /api 接口代理）
│   ├── webpack.release.js   # 发布配置工厂（test/prod 共用，单文件内联）
│   ├── webpack.test.js      # 测试环境打包（产物 dist-test/）
│   ├── webpack.prod.js      # 生产环境打包（产物 dist/）
│   └── style-loaders.js     # 样式 loader 工厂（SCSS 变量自动注入）
├── public/index.html          # HTML 模板
├── src/
│   ├── main.js                # 入口：注册 ElementUI / 路由 / 全局样式
│   ├── App.vue                # 根组件（顶部导航 + router-view + keep-alive）
│   ├── router/index.js        # 路由表（懒加载、标题、重复导航兜底）
│   ├── config/env.js          # 运行时环境信息（由构建注入派生）
│   ├── api/
│   │   ├── definitions.js     # ★ 接口注册表：新增接口只改这里
│   │   ├── index.js           # 注册表 → 自动生成 api['模块.方法'] 调用函数
│   │   └── user.js            # 业务模块适配（语义化包装示例）
│   ├── utils/request.js       # axios 封装（拦截器/token/错误码/401/重复取消/日志）
│   ├── styles/
│   │   ├── variables.scss     # 全局 SCSS 变量（自动注入，无需手动 import）
│   │   └── index.scss         # 全局基础样式
│   └── views/
│       ├── Home.vue           # 首页（SCSS 示例 + ElementUI 组件）
│       ├── About.vue          # 关于页（LESS 示例）
│       ├── ApiDemo.vue        # 接口 Demo 页
│       └── Settings.vue       # ★ 系统配置页：环境总览 + 接口清单管理 + 在线测试
└── package.json
```

## 使用

```bash
# 开发（热更新，自动打开 http://localhost:8080，接口走 .env.development 代理）
npm run dev

# 测试环境打包 → dist-test/index.html（自包含单文件）
npm run build:test

# 生产环境打包 → dist/index.html（自包含单文件，双击即可打开）
npm run build
```

## 环境管理

三套环境文件各司其职，构建时由 `config/load-env.js` 读取并经 DefinePlugin 注入：

| 文件 | 关键变量 | 说明 |
| --- | --- | --- |
| `.env.development` | `VUE_APP_BASE_API=/api`、`DEV_PROXY_TARGET=...` | 请求走 `/api`，devServer 代理到 `DEV_PROXY_TARGET`（解决跨域） |
| `.env.test` | `VUE_APP_BASE_API=https://test-api.example.com` | 测试服地址、vConsole/日志开启 |
| `.env.production` | `VUE_APP_BASE_API=/api` | 同源部署 + Nginx 反代；日志关闭 |

- 业务代码统一 `import { APP_ENV, BASE_API, IS_PROD } from '@/config/env'`，不散落 `process.env`；
- 页面右下角「系统配置」可直观看到当前包的环境、接口前缀、构建时间；
- **对接真实后端**：把 `.env.development` 的 `DEV_PROXY_TARGET` 和 `.env.test/.production` 的 `VUE_APP_BASE_API` 改成自己后端地址即可。

### Liberty_Login_Token（测试环境专属请求头）

- `.env` 的 `VUE_APP_LIBERTY_TOKEN=true` 时（development/test 开、production 关），所有业务请求自动携带请求头 `Liberty_Login_Token`，值取自 `/Login/MobileLogin` 返回的 `data`；
- 令牌 30~40 分钟在后端轮换：本地按 35 分钟缓存（TTL 可调 `VUE_APP_LIBERTY_TTL_MINUTES`），到期自动重新登录获取，并发请求共享同一次登录；若后端提前作废（返回鉴权类错误），拦截器会自动刷新令牌并重试一次；
- 账号密码配在 `.env`（`VUE_APP_LIBERTY_ACCOUNT / _PASSWORD`），「系统配置」页有令牌状态面板可查看当前值、有效期、手动刷新；
- **生产包保证不带**：开关是编译期常量，`npm run build` 时整块令牌逻辑被 terser 死代码消除（已核查产物中无设置该请求头的代码）。

## 接口管理

**单一数据源**：所有接口在 `src/api/definitions.js` 注册表声明（模块 / 名称 / 方法 / 路径 / 描述 / 是否需要登录 / 状态 / 示例参数）。

```js
// 1) 新增接口 = 在 definitions 里加一条
{ id: 'order.list', module: '订单', name: '订单列表', method: 'GET',
  path: '/order/list', desc: '分页查询订单', auth: true, status: 'ready',
  sample: { params: { page: 1 } } }

// 2) 任何地方直接调用（自动拼 baseURL、带 token、重复请求取消）
import api from '@/api';
const data = await api['order.list']({ params: { page: 1 } });
```

- `path` 支持 `:id` 路径参数，调用时 `{ params: { id: 2 } }` 自动替换；
- 相对路径自动拼环境 `BASE_API`，`http(s)` 开头的完整地址直接使用（演示 mock 接口用）；
- `status: mock/ready/todo` 管理接入进度：**「系统配置」页**表格化展示全部接口，支持按模块/状态筛选、关键字搜索、**一键在线发请求测试**并展示结果与耗时；
- 请求层能力：全屏 loading（`loading: true`）、重复请求自动取消（`noDuplicate: false` 可关）、接口日志（由 `.env` 开关控制）。

## 关键设计说明

1. **为什么路由用 hash 模式？** 单文件 `file://` 打开时 history 模式子路由会 404，hash 模式完全可用。部署到 Nginx 想用 history 改 `src/router/index.js` 的 `mode` 即可。
2. **SCSS 全局变量** `src/styles/variables.scss` 自动注入每个 SCSS 模块（含 `.vue` 的 `<style lang="scss">`），组件里直接写 `$primary`。
3. **热更新范围** `.vue` 模板/脚本/样式、`.scss`、`.less` 修改均 HMR，组件状态保留、无需刷新。
4. **单文件打包原理** 发布配置（`webpack.release.js`）样式走 style-loader、图片字体转 base64、分包合并为 1 个 chunk，再由 `InlineHtmlAssetsPlugin` 把 JS 内联进 `index.html`；`dist-test/` 与 `dist/` 分别对应测试与生产环境，产物均为约 1.3 MB 的单文件。
5. **环境注入安全性** DefinePlugin 逐键替换 `process.env.VUE_APP_*` 等声明过的变量，未声明的保持原样，避免整体替换引发第三方库异常。
