/**
 * 接口注册表（单一数据源）
 * —— 所有 HTTP 接口在这里声明，api/index.js 据此生成可调用函数，
 *    「系统配置」页面同样读取这里做清单展示与在线测试。新增接口只改本文件。
 *
 * 字段说明：
 *   id          全局唯一标识（模块.名称）
 *   module      业务模块
 *   name        接口中文名
 *   method      HTTP 方法
 *   path        路径：相对路径自动拼 baseURL（开发走 /api 代理）；http(s) 开头则直接使用
 *   desc        用途描述
 *   auth        是否需要登录态
 *   status      ready（有真实后端可调）/ mock（公共演示地址，任何环境可测）/ todo（后端未提供）
 *   sample      在线测试用的示例参数 { params, data }
 */

const DEMO_BASE = 'https://jsonplaceholder.typicode.com';

const definitions = [
  // ———— 演示模块：公共 mock 接口，任何环境都能真实调通 ————
  {
    id: 'demo.getPosts',
    module: '演示接口',
    name: '获取文章列表',
    method: 'GET',
    path: `${DEMO_BASE}/posts`,
    desc: '公共 mock：验证 axios 封装与响应拦截',
    auth: false,
    status: 'mock',
    sample: { params: { _limit: 3 } }
  },
  {
    id: 'demo.createPost',
    module: '演示接口',
    name: '新建文章',
    method: 'POST',
    path: `${DEMO_BASE}/posts`,
    desc: '公共 mock：验证 POST + JSON body',
    auth: false,
    status: 'mock',
    sample: { data: { title: '来自 H5 后台', body: 'axios 封装测试', userId: 1 } }
  },
  {
    id: 'demo.getTodo',
    module: '演示接口',
    name: '按 ID 获取待办',
    method: 'GET',
    path: `${DEMO_BASE}/todos/:id`,
    desc: '公共 mock：带路径参数接口示例',
    auth: false,
    status: 'mock',
    sample: { params: { id: 2 }, pathParams: { id: 2 } }
  },
  {
    id: 'demo.failRequest',
    module: '演示接口',
    name: '故意 404（验证错误处理）',
    method: 'GET',
    path: `${DEMO_BASE}/not-exist`,
    desc: '触发错误分支：统一错误提示、日志',
    auth: false,
    status: 'mock',
    sample: {}
  },

  // ———— 业务接口：对接真实后端 qice.lebian.xyz（路径不带 /api 前缀，
  //      开发环境经 devServer 代理转发，见 .env.development） ————
  {
    id: 'backend.ping',
    module: '后端联调',
    name: '登录脚本探活',
    method: 'GET',
    path: '/js/login/index.js',
    desc: '同源真实资源：一键验证 dev 代理是否打到 qice 后端',
    auth: false,
    status: 'ready',
    sample: {}
  },
  {
    id: 'user.login',
    module: '用户中心',
    name: '移动端登录',
    method: 'GET',
    path: '/Login/MobileLogin',
    desc: '登录：account + password 以 query 传值',
    auth: false,
    status: 'ready',
    sample: { params: { account: 'system', password: 'lbj123321' } }
  },
  {
    id: 'user.getUserList',
    module: '用户中心',
    name: '用户列表',
    method: 'GET',
    path: '/user/list',
    desc: '分页查询用户',
    auth: true,
    status: 'todo',
    sample: { params: { page: 1, size: 10 } }
  },
  {
    id: 'system.getDict',
    module: '系统管理',
    name: '数据字典',
    method: 'GET',
    path: '/system/dict',
    desc: '全局字典表，登录后拉取并缓存',
    auth: true,
    status: 'todo',
    sample: {}
  }
];

export default definitions;
