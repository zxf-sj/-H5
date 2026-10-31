<template>
  <div class="settings">
    <!-- ==================== 环境管理 ==================== -->
    <div class="card">
      <h2 class="sec-title">当前运行环境</h2>
      <div class="env-tags">
        <el-tag :type="envTagType" size="medium" effect="dark">{{ envLabel }}</el-tag>
        <span class="env-tip">
          构建模式 <b>{{ buildInfo.mode }}</b> · 构建时间 <b>{{ buildInfo.buildTime }}</b>
        </span>
      </div>
      <el-descriptions :column="isNarrow ? 1 : 2" border size="small" style="margin-top: 12px">
        <el-descriptions-item label="环境标识（VUE_APP_ENV）">{{ buildInfo.env }}</el-descriptions-item>
        <el-descriptions-item label="接口前缀（VUE_APP_BASE_API）">{{ buildInfo.baseApi }}</el-descriptions-item>
        <el-descriptions-item label="接口日志">
          <el-tag size="mini" :type="enableLog ? 'success' : 'info'">{{ enableLog ? '开启' : '关闭' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="路由模式">hash（单文件 file:// 可用）</el-descriptions-item>
      </el-descriptions>

      <p class="tip" style="margin-top: 12px">
        环境在<b>打包时</b>由 <code>.env.development / .env.test / .env.production</code>
        决定，运行时不切换。接口地址等改 <code>.env.*</code> 后重新打包即可。
      </p>

      <el-table :data="envOptions" border size="mini" style="width: 100%; margin-top: 8px">
        <el-table-column prop="label" label="环境" width="110" />
        <el-table-column prop="desc" label="用途与说明" />
        <el-table-column label="命令" width="190">
          <template #default="{ row }">
            <code class="cmd">{{ row.command }}</code>
          </template>
        </el-table-column>
        <el-table-column label="当前" width="60" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.value === buildInfo.env" type="success" size="mini">✓</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- ==================== 登录令牌（测试环境） ==================== -->
    <div class="card">
      <h2 class="sec-title">
        Liberty_Login_Token
        <span class="count-tip">测试/开发环境自动为业务请求携带；生产包不含此逻辑</span>
      </h2>

      <div v-if="liberty.enabled">
        <div class="token-row">
          <el-tag :type="liberty.hasToken ? 'success' : 'warning'" size="small" effect="dark">
            {{ liberty.hasToken ? '已获取' : '未获取' }}
          </el-tag>
          <span class="env-tip">
            有效期至 <b>{{ liberty.expireAt || '—' }}</b>（约 35 分钟自动续期）
          </span>
          <el-button type="primary" size="mini" :loading="libertyRefreshing" @click="refreshToken">
            立即刷新
          </el-button>
        </div>
        <div class="token-val">
          <el-input :value="liberty.token || '（尚未发起过业务请求）'" readonly size="small">
            <span slot="prepend">令牌值</span>
          </el-input>
        </div>
        <p class="tip" style="margin-top: 8px">
          令牌取自 <code>/Login/MobileLogin</code> 返回的 <code>data</code>，缓存在 sessionStorage；
          到期或后端提前作废（返回鉴权类错误）时会自动重新登录获取，业务无感知。
        </p>
      </div>
      <p v-else class="tip">当前构建环境未启用令牌注入（<code>VUE_APP_LIBERTY_TOKEN=false</code>）。</p>
    </div>

    <!-- ==================== 接口管理 ==================== -->
    <div class="card">
      <h2 class="sec-title">
        接口清单
        <span class="count-tip">共 {{ apiList.length }} 个（注册表：src/api/definitions.js，改一处全局生效）</span>
      </h2>

      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索名称 / 路径 / 描述"
          size="small"
          clearable
          style="width: 220px"
          prefix-icon="el-icon-search"
        />
        <el-select v-model="moduleFilter" placeholder="全部模块" size="small" clearable style="width: 140px">
          <el-option v-for="m in modules" :key="m" :label="m" :value="m" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="全部状态" size="small" clearable style="width: 120px">
          <el-option label="演示可调" value="mock" />
          <el-option label="已就绪" value="ready" />
          <el-option label="待接入" value="todo" />
        </el-select>
      </div>

      <el-table :data="filteredApis" border size="mini" style="width: 100%">
        <el-table-column prop="module" label="模块" width="90" />
        <el-table-column prop="name" label="接口名称" width="170" show-overflow-tooltip />
        <el-table-column label="方法" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="methodTagType(row.method)" size="mini">{{ row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" show-overflow-tooltip />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta[row.status].type" size="mini">{{ statusMeta[row.status].label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="mini"
              :loading="row.testing"
              :disabled="row.status === 'todo'"
              @click="testApi(row)"
            >
              {{ row.status === 'todo' ? '—' : '测试' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <p class="tip" style="margin-top: 10px">
        「待接入」接口为后端未提供的业务示例（已在注册表声明），对接后把 <code>status</code> 改为
        <code>ready</code> 即可开放测试；调用统一走 <code>@/utils/request</code>（自动带 token、重复请求取消、错误提示）。
      </p>
    </div>

    <!-- ==================== 测试结果 ==================== -->
    <el-dialog :title="testTitle" :visible.sync="dialogVisible" width="560px" append-to-body>
      <div class="result-meta" v-if="testMeta">
        <span>{{ testMeta.method }} {{ testMeta.path }}</span>
        <el-tag :type="testMeta.ok ? 'success' : 'danger'" size="mini">
          {{ testMeta.ok ? '成功' : '失败' }} · {{ testMeta.cost }}ms
        </el-tag>
      </div>
      <pre class="result-box">{{ testResult }}</pre>
      <span slot="footer">
        <el-button size="small" @click="dialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from '@/api';
import { BUILD_INFO, ENV_OPTIONS, ENABLE_API_LOG } from '@/config/env';
import { libertyTokenStatus, refreshLibertyToken } from '@/utils/liberty-token';

export default {
  name: 'Settings',
  data() {
    return {
      buildInfo: BUILD_INFO,
      enableLog: ENABLE_API_LOG,
      liberty: libertyTokenStatus(),
      libertyRefreshing: false,
      envOptions: ENV_OPTIONS.map((e) => ({
        ...e,
        command:
          e.value === 'development'
            ? 'npm run dev'
            : e.value === 'test'
              ? 'npm run build:test'
              : 'npm run build'
      })),
      statusMeta: {
        mock: { label: '演示可调', type: 'success' },
        ready: { label: '已就绪', type: '' },
        todo: { label: '待接入', type: 'warning' }
      },
      keyword: '',
      moduleFilter: '',
      statusFilter: '',
      apiList: api.getApiList().map((d) => ({ ...d, testing: false })),
      dialogVisible: false,
      testTitle: '',
      testResult: '',
      testMeta: null
    };
  },
  computed: {
    modules() {
      return api.getModules();
    },
    isNarrow() {
      return window.innerWidth < 640;
    },
    envLabel() {
      const hit = this.envOptions.find((e) => e.value === this.buildInfo.env);
      return hit ? hit.label : this.buildInfo.env;
    },
    envTagType() {
      return { development: 'info', test: 'warning', production: 'success' }[this.buildInfo.env] || 'info';
    },
    filteredApis() {
      const k = this.keyword.trim().toLowerCase();
      return this.apiList.filter((row) => {
        if (this.moduleFilter && row.module !== this.moduleFilter) return false;
        if (this.statusFilter && row.status !== this.statusFilter) return false;
        if (!k) return true;
        return [row.name, row.path, row.desc, row.id, row.module].join(' ').toLowerCase().includes(k);
      });
    }
  },
  activated() {
    this.liberty = libertyTokenStatus();
  },
  methods: {
    methodTagType(method) {
      return { GET: 'success', POST: 'warning', PUT: '', DELETE: 'danger' }[method] || 'info';
    },
    refreshToken() {
      this.libertyRefreshing = true;
      refreshLibertyToken()
        .then(() => {
          this.$message.success('令牌已刷新');
        })
        .catch((e) => {
          this.$message.error(e.message || '刷新失败');
        })
        .finally(() => {
          this.libertyRefreshing = false;
          this.liberty = libertyTokenStatus();
        });
    },
    async testApi(row) {
      this.$set(row, 'testing', true);
      const start = Date.now();
      const sample = row.sample || {};
      try {
        const data = await api[row.id]({
          params: { ...(sample.params || {}) },
          data: sample.data
        });
        this.testMeta = { ok: true, cost: Date.now() - start, method: row.method, path: row.path };
        this.testResult = this.pretty(data);
      } catch (e) {
        this.testMeta = { ok: false, cost: Date.now() - start, method: row.method, path: row.path };
        this.testResult = e.message === 'canceled' || (e && e.__CANCEL__) ? '请求被取消（重复请求）' : String(e.message || e);
      } finally {
        this.$set(row, 'testing', false);
        this.testTitle = `测试结果 · ${row.name}`;
        this.dialogVisible = true;
      }
    },
    pretty(data) {
      const text = JSON.stringify(data, null, 2);
      return text && text.length > 2000 ? text.slice(0, 2000) + '\n…（内容过长已截断）' : text;
    }
  }
};
</script>

<style lang="scss" scoped>
.sec-title {
  font-size: 16px;
  color: $header-bg;
  margin-bottom: 10px;
}
.count-tip {
  font-size: 12px;
  font-weight: normal;
  color: #999;
  margin-left: 6px;
}
.env-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  .env-tip {
    color: #666;
    font-size: 13px;
  }
}
.token-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.token-val {
  max-width: 640px;
}
.tip {
  color: #666;
  line-height: 1.8;
  font-size: 13px;
  code {
    background: #f0f2f5;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 12px;
  }
}
.cmd {
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #c7254e;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.result-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
  word-break: break-all;
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
