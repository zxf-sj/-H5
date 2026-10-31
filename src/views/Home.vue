<template>
  <div class="home">
    <div class="card">
      <div class="card-head">
        <span class="card-head__title">巴士订单</span>
        <el-button
          type="primary"
          size="mini"
          plain
          @click="$router.push('/bus-admin')"
          >巴士管理</el-button
        >
      </div>
      <el-form :inline="true" size="small">
        <el-form-item label="筛选时间段" size="mini">
          <el-date-picker
            v-model="form.datetimerange"
            format="yyyy-MM-dd HH:mm:ss"
            value-format="yyyy-MM-dd HH:mm:ss"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item label="订单状态" size="mini">
          <el-select v-model="form.OrderStatus" placeholder="请选择">
            <el-option
              v-for="item in busOrderStateList"
              :key="item.Value"
              :label="item.Text"
              :value="item.Value"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="巴士线路" size="mini">
          <el-select v-model="form.LineId" placeholder="请选择">
            <el-option
              v-for="item in busLineList"
              :key="item.Id"
              :label="item.LineName"
              :value="item.Id"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="付款状态" size="mini">
          <el-select v-model="form.PayStatus" placeholder="请选择">
            <el-option
              v-for="item in busPayStatusList"
              :key="item.Value"
              :label="item.Text"
              :value="item.Value"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item size="mini">
          <el-button type="primary" @click="getDataList" size="mini"
            >查询</el-button
          >
          <el-button @click="handleReset" size="mini">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border size="mini" style="width: 100%">
        <el-table-column
          prop="PassengerPhone"
          label="乘客信息"
          width="120"
          align="center"
        />
        <el-table-column prop="Driver_Name" label="司机信息" align="center" />
        <el-table-column
          prop="Driver_Phone"
          label="司机手机号"
          align="center"
        />
        <el-table-column prop="Vehicle_No" label="车牌号" align="center" />
        <el-table-column prop="TicketNum" label="乘客人数" align="center" />
        <el-table-column
          prop="OrderSource_Name"
          label="订单来源"
          align="center"
        />
        <el-table-column
          prop="OrderStatus_Name"
          label="订单状态"
          align="center"
        />
        <el-table-column
          prop="DepartureTime_DateTime"
          label="出发时间"
          align="center"
        />
        <el-table-column
          prop="PayStatus_Name"
          label="付款状态"
          align="center"
        />
        <el-table-column
          prop="StatingLocation_Name"
          label="出发地点"
          align="center"
        />
        <el-table-column
          prop="EndLocation_Name"
          label="到达地点"
          align="center"
        />
        <el-table-column prop="Member_Name" label="下单人姓名" align="center" />
        <el-table-column
          prop="Member_Phone"
          label="下单人手机号"
          align="center"
        />
        <el-table-column fixed="right" label="操作" width="130" align="center">
          <template slot-scope="scope">
            <el-button @click="handleDetail(scope.row)" type="text" size="small"
              >查看</el-button
            >
            <el-button type="text" size="small">修改</el-button>
            <el-button type="text" size="small">退款</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="listParams.pageIndex"
      :page-sizes="[10, 20, 30, 40]"
      :page-size="10"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
    >
    </el-pagination>
    <el-dialog
      title="订单详情"
      :visible.sync="detailVisible"
      width="900px"
      top="6vh"
      custom-class="order-detail-dialog"
      :close-on-click-modal="false"
      @closed="handleDetailClosed"
    >
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="detail">
          <div class="detail-head">
            <div class="detail-head__no">
              <span class="label">订单号</span>
              <span class="no">{{ detail.OrderNo || '-' }}</span>
            </div>
            <div class="detail-head__tags">
              <el-tag size="mini" :type="orderStatusTagType">{{
                detail.OrderStatus_Name || '-'
              }}</el-tag>
              <el-tag size="mini" :type="payStatusTagType" effect="plain">{{
                detail.PayStatus_Name || '-'
              }}</el-tag>
            </div>
            <div class="detail-head__amount">
              实付
              <span class="amount">¥ {{ formatMoney(detail.PayAmount) }}</span>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section__title">订单信息</div>
            <el-descriptions :column="3" border size="mini">
              <el-descriptions-item label="订单号">{{
                detail.OrderNo || '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="订单来源">{{
                detail.OrderSource_Name || '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="下单时间">{{
                detail.CreateTime_DateTime || formatDate(detail.CreateTime)
              }}</el-descriptions-item>
              <el-descriptions-item label="下单人">{{
                detail.Member_Name || '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="下单人手机号">{{
                detail.Member_Phone || '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="乘客手机号">{{
                detail.PassengerPhone || '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="乘客人数"
                >{{ detail.TicketNum || 0 }} 人</el-descriptions-item
              >
              <el-descriptions-item label="出发时间">{{
                detail.DepartureTime_DateTime ||
                formatDate(detail.DepartureTime)
              }}</el-descriptions-item>
              <el-descriptions-item label="备注">{{
                detail.Remark || detail.Note || '-'
              }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="detail-section">
            <div class="detail-section__title">行程信息</div>
            <el-descriptions :column="3" border size="mini">
              <el-descriptions-item label="巴士线路">{{
                detail.Line_Name || '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="车牌号">{{
                detail.Vehicle_Name || '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="司机姓名">{{
                detail.Driver_Name || '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="司机手机号">{{
                detail.Driver_Phone || '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="出发地点">{{
                detail.StatingLocation_Name || '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="到达地点">{{
                detail.EndLocation_Name || '-'
              }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="detail-section">
            <div class="detail-section__title">金额信息</div>
            <el-descriptions :column="3" border size="mini">
              <el-descriptions-item label="票价"
                >¥ {{ formatMoney(detail.TicketPrice) }}</el-descriptions-item
              >
              <el-descriptions-item label="订单金额"
                >¥ {{ formatMoney(detail.TotalAmount) }}</el-descriptions-item
              >
              <el-descriptions-item label="优惠金额"
                >¥ {{ formatMoney(detail.DiscountAmount) }}</el-descriptions-item
              >
              <el-descriptions-item label="实付金额"
                >¥ {{ formatMoney(detail.PayAmount) }}</el-descriptions-item
              >
              <el-descriptions-item label="支付方式">{{
                detail.PayType_Name || '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="支付时间">{{
                formatDate(detail.PayTime)
              }}</el-descriptions-item>
              <el-descriptions-item label="退款金额"
                >¥ {{ formatMoney(detail.RefundAmount) }}</el-descriptions-item
              >
              <el-descriptions-item label="退款时间">{{
                formatDate(detail.RefundTime)
              }}</el-descriptions-item>
              <el-descriptions-item label="退款原因">{{
                detail.RefundReason || '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="取消原因">{{
                detail.CancelReason || '-'
              }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="detail-section">
            <div class="detail-section__title">
              乘车人（{{ passengerList.length }} 人）
            </div>
            <el-table
              :data="passengerList"
              border
              size="mini"
              empty-text="暂无乘车人信息"
            >
              <el-table-column
                type="index"
                label="#"
                width="50"
                align="center"
              />
              <el-table-column
                prop="Name"
                label="姓名"
                min-width="100"
                align="center"
              />
              <el-table-column
                prop="Code"
                label="手机号"
                min-width="130"
                align="center"
              />
              <el-table-column
                prop="IDCard"
                label="身份证号"
                min-width="180"
                align="center"
              />
            </el-table>
          </div>

          <div class="detail-section">
            <div class="detail-section__title">操作日志</div>
            <el-timeline v-if="logList.length" class="detail-logs">
              <el-timeline-item
                v-for="(item, index) in logList"
                :key="index"
                :timestamp="formatDate(item.CreateDate)"
                placement="top"
              >
                {{ item.Name }}
              </el-timeline-item>
            </el-timeline>
            <div v-else class="detail-empty">暂无操作日志</div>
          </div>
        </template>
        <el-empty
          v-else-if="!detailLoading"
          description="暂无订单详情"
          :image-size="80"
        ></el-empty>
      </div>
      <span slot="footer">
        <el-button size="small" @click="detailVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request'
export default {
  name: 'Home',
  data() {
    return {
      detailVisible: false,
      detailLoading: false,
      detail: null, // GetBusOrderInfo 返回的订单详情
      total: 100,
      form: {
        datetimerange: [],
        OrderStatus: null,
        LineId: null,
        PayStatus: null,
      },
      tableData: [],
      loading: false,
      busOrderStateList: [], //订单状态
      busLineList: [], //巴士线路
      busPayStatusList: [], //付款状态
      listParams: {
        OrderNo: null,
        PassengerPhone: null,
        LineId: null,
        PayStatus: null,
        OrderStatus: null,
        StartDepartureTime: null,
        EndDepartureTime: null,
        StartCreateTime: null,
        EndCreateTime: null,
        pageIndex: 1,
        pageSize: 10,
      },
    }
  },
  computed: {
    // 乘车人列表
    passengerList() {
      return (this.detail && this.detail.Userlist) || []
    },
    // 操作日志
    logList() {
      return (this.detail && this.detail.loglist) || []
    },
    // 订单状态标签色：接口只给中文名，这里按关键词兜底映射
    orderStatusTagType() {
      const name = (this.detail && this.detail.OrderStatus_Name) || ''
      if (/取消|作废|关闭/.test(name)) return 'info'
      if (/完成|结束|已发车|已到达/.test(name)) return 'success'
      if (/进行|行程中|改签/.test(name)) return 'warning'
      return ''
    },
    // 付款状态标签色
    payStatusTagType() {
      const name = (this.detail && this.detail.PayStatus_Name) || ''
      if (/待支付|未支付/.test(name)) return 'warning'
      if (/已支付|已付款/.test(name)) return 'success'
      if (/退款/.test(name)) return 'info'
      return ''
    },
  },
  created() {
    console.log('Home.vue created')
  },
  mounted() {
    console.log('Home.vue mounted')
    this.getBusOrderStateList()
    this.getBusLineList()
    this.getBusPayStatusList()
    this.getDataList()
  },
  methods: {
    handleSizeChange(res) {
      console.log('88888888888', res)
      this.listParams.pageSize = res
      this.tableData = []
      this.getDataList()
    },
    handleCurrentChange(res) {
      console.log('999999999', res)
      this.listParams.pageIndex = res
      this.tableData = []
      this.getDataList()
    },
    // 查看：打开弹窗并拉取订单详情
    async handleDetail(res) {
      if (!res || !res.Id) return
      this.detailVisible = true
      this.detailLoading = true
      this.detail = null
      try {
        const data = await request({
          url: '/BusOrder/GetBusOrderInfo',
          method: 'get',
          params: { Id: res.Id },
        })
        this.detail = data.data || null
      } catch (e) {
        // 错误提示由 request 拦截器统一弹出，这里只保证弹窗不残留旧数据
        this.detail = null
      } finally {
        this.detailLoading = false
      }
    },
    // 弹窗关闭后清空详情，避免下次打开闪一下上一条数据
    handleDetailClosed() {
      this.detail = null
      this.detailLoading = false
    },
    // 金额保留两位小数
    formatMoney(val) {
      const num = Number(val)
      return Number.isFinite(num) ? num.toFixed(2) : '0.00'
    },
    // 时间戳 / 日期字符串统一格式化为 yyyy-MM-dd HH:mm:ss，空值显示 -
    formatDate(val) {
      if (val === null || val === undefined || val === '') return '-'
      let date
      if (typeof val === 'number') {
        date = new Date(val)
      } else if (/^\d+$/.test(val)) {
        date = new Date(Number(val))
      } else {
        // 兼容 "2026-10-29 14:23:32" 与 "10/29/2026 14:23:32"
        date = new Date(String(val).replace(/-/g, '/'))
      }
      if (!date || isNaN(date.getTime())) return String(val)
      const pad = (n) => (n < 10 ? '0' + n : '' + n)
      return (
        date.getFullYear() +
        '-' +
        pad(date.getMonth() + 1) +
        '-' +
        pad(date.getDate()) +
        ' ' +
        pad(date.getHours()) +
        ':' +
        pad(date.getMinutes()) +
        ':' +
        pad(date.getSeconds())
      )
    },
    //获取订单状态
    async getBusOrderStateList() {
      this.loading = true
      this.err = ''
      try {
        const data = await request({
          url: '/BusOrder/GetBusOrderStateList',
          method: 'get',
        })
        this.busOrderStateList = data.data
        console.log(data)
      } catch (e) {
        this.err = e.message || String(e)
      } finally {
        this.loading = false
      }
    },
    //获取巴士线路
    async getBusLineList() {
      this.loading = true
      this.err = ''
      try {
        const data = await request({
          url: '/BusOrder/GetBusLineList',
          method: 'get',
        })
        this.busLineList = data.data
        console.log(data)
      } catch (e) {
        this.err = e.message || String(e)
      } finally {
        this.loading = false
      }
    },
    //获取付款状态
    async getBusPayStatusList() {
      this.loading = true
      this.err = ''
      try {
        const data = await request({
          url: '/BusOrder/GetBusPayStatusList',
          method: 'get',
        })
        this.busPayStatusList = data.data
        console.log(data)
      } catch (e) {
        this.err = e.message || String(e)
      } finally {
        this.loading = false
      }
    },
    // 重置筛选条件并重新查询
    handleReset() {
      this.form.datetimerange = []
      this.form.OrderStatus = null
      this.form.LineId = null
      this.form.PayStatus = null
      this.listParams.OrderStatus = null
      this.listParams.LineId = null
      this.listParams.PayStatus = null
      this.listParams.StartCreateTime = null
      this.listParams.EndCreateTime = null
      this.listParams.pageIndex = 1
      this.getDataList()
    },
    async getDataList() {
      this.loading = true
      this.err = ''
      console.log(this.form)
      if (this.form.datetimerange && this.form.datetimerange.length > 0) {
        this.listParams.StartCreateTime = this.form.datetimerange[0]
        this.listParams.EndCreateTime = this.form.datetimerange[1]
      } else {
        // 时间段被清空时同步清掉上一次的查询条件，否则会一直带着旧时间筛选
        this.listParams.StartCreateTime = null
        this.listParams.EndCreateTime = null
      }
      this.listParams.OrderStatus = this.form.OrderStatus
      this.listParams.LineId = this.form.LineId
      this.listParams.PayStatus = this.form.PayStatus

      console.log(this.listParams)

      try {
        const data = await request({
          url: '/BusOrder/GetBusOrderPageList',
          method: 'post',
          data: this.listParams,
        })
        console.log('55555555555555', data)
        this.tableData = data.data
        this.total = data.count
      } catch (e) {
        console.log(e)
        this.err = e.message || String(e)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: $header-bg;
  }
}
.sec-title {
  font-size: 16px;
  color: $header-bg;
  margin-bottom: 8px;
}
.tip {
  color: #666;
  line-height: 1.8;
  code {
    background: #f0f2f5;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 13px;
  }
}
.feat-row {
  margin-top: 12px;
  .feat {
    background: lighten($primary, 42%);
    color: darken($primary, 15%);
    border: 1px solid lighten($primary, 30%);
    border-radius: $radius;
    padding: 10px;
    text-align: center;
    margin-bottom: 12px;
    font-weight: 600;
  }
}

/* —— 订单详情弹窗 —— */
.detail-body {
  min-height: 180px;
  max-height: 72vh;
  overflow-y: auto;
  padding-right: 6px;
}
.detail-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 12px;
  margin-bottom: 16px;
  background: $page-bg;
  border: 1px solid #ebeef5;
  border-radius: $radius;

  &__no {
    flex: 1;
    min-width: 240px;
    font-size: 13px;
    color: #606266;
    .label {
      color: #909399;
      margin-right: 6px;
    }
    .no {
      font-weight: 600;
      color: $header-bg;
      letter-spacing: 0.3px;
    }
  }
  &__tags {
    margin-right: 16px;
    .el-tag + .el-tag {
      margin-left: 8px;
    }
  }
  &__amount {
    font-size: 13px;
    color: #909399;
    .amount {
      font-size: 18px;
      font-weight: 600;
      color: $danger;
    }
  }
}
.detail-section {
  & + & {
    margin-top: 18px;
  }
  &__title {
    margin-bottom: 10px;
    padding-left: 8px;
    border-left: 3px solid $primary;
    font-size: 13px;
    font-weight: 600;
    line-height: 14px;
    color: $header-bg;
  }
}
.detail-logs {
  padding-top: 4px;
  margin-bottom: 0;
}
.detail-empty {
  padding: 8px 0;
  font-size: 13px;
  color: #909399;
}
::v-deep .order-detail-dialog .el-dialog__body {
  padding-top: 12px;
  padding-bottom: 0;
}
::v-deep .el-descriptions-item__label {
  color: #909399;
}

</style>
