<template>
  <div class="bus-operations">
    <div class="panel">
      <div class="panel__head">
        <span class="panel__title">巴士运营时刻</span>
        <span class="panel__tip"
          >按路线 + 日期查询当天班次，可切换售卖开关、查看运营详情</span
        >
      </div>

      <el-form :inline="true" size="mini" class="filter-bar">
        <el-form-item label="路线">
          <el-select
            v-model="lineId"
            filterable
            clearable
            placeholder="全部路线"
            class="line-filter"
            :loading="lineLoading"
            @change="loadList"
          >
            <el-option
              v-for="item in lineList"
              :key="item.Id"
              :label="item.LineName"
              :value="item.Id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="today"
            type="date"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            :clearable="false"
            class="date-filter"
            @change="loadList"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="loadList"
            >查询</el-button
          >
          <el-button icon="el-icon-refresh" @click="loadList">刷新</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="listLoading"
        :data="list"
        border
        size="mini"
        style="width: 100%"
        empty-text="暂无运营班次"
      >
        <el-table-column prop="Id" label="ID" width="80" align="center" />
        <el-table-column label="发车时间" width="200" align="center">
          <template slot-scope="scope">
            {{
              pick(scope.row, [
                'DepartureTime',
                'StartTime',
                'DepartureTime_DateTime',
              ]) || '-'
            }}
          </template>
        </el-table-column>
        <el-table-column label="路线" min-width="120">
          <template slot-scope="scope">
            {{
              pick(scope.row, ['LineId_Name', 'Line_Name', 'LineName']) || '-'
            }}
          </template>
        </el-table-column>
        <el-table-column label="起始站" min-width="120">
          <template slot-scope="scope">
            {{ scope.row.StatingLocation_Name }}
          </template>
        </el-table-column>
        <el-table-column label="终点站" min-width="120">
          <template slot-scope="scope">
            {{ scope.row.EndLocation_Name }}
          </template>
        </el-table-column>
        <el-table-column label="车辆" min-width="100" align="center">
          <template slot-scope="scope">
            {{
              pick(scope.row, [
                'VehicleId_Name',
                'Vehicle_Name',
                'VehicleNo',
              ]) || '-'
            }}
          </template>
        </el-table-column>
        <el-table-column label="司机" min-width="120" align="center">
          <template slot-scope="scope">
            {{
              pick(scope.row, ['DriverId_Name', 'Driver_Name', 'DriverName']) ||
              '-'
            }}
          </template>
        </el-table-column>
        <el-table-column label="上车人数" width="80" align="center">
          <template slot-scope="scope">
            {{ scope.row.PersonNum }}
          </template>
        </el-table-column>
        <el-table-column label="总座位数" width="80" align="center">
          <template slot-scope="scope">
            {{ scope.row.SeatTotal }}
          </template>
        </el-table-column>
        <el-table-column label="预约座位数" width="100" align="center">
          <template slot-scope="scope">
            {{ scope.row.SeatSold }}
          </template>
        </el-table-column>
        <el-table-column label="基准票价" width="90" align="center">
          <template slot-scope="scope"> ¥ {{ scope.row.SitePrice }} </template>
        </el-table-column>
        <el-table-column label="优惠票价" width="90" align="center">
          <template slot-scope="scope">
            ¥ {{ scope.row.TicketPrice }}
          </template>
        </el-table-column>
        <el-table-column label="开关" width="120" align="center">
          <template slot-scope="scope">
            <el-switch
              :value="isSaleOn(scope.row)"
              active-text="开"
              inactive-text="关"
              :disabled="switchingId === scope.row.Id"
              @change="(val) => handleSwitchSale(scope.row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="openEdit(scope.row)"
              >修改</el-button
            >
            <el-button type="text" size="mini" @click="openDetail(scope.row)"
              >详情</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 运营详情弹窗 -->
    <el-dialog
      :title="detailTitle"
      :visible.sync="detailVisible"
      width="720px"
      top="6vh"
      :close-on-click-modal="false"
      @closed="handleDetailClosed"
    >
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="detail">
          <el-descriptions :column="2" border size="mini">
            <el-descriptions-item label="ID">
              {{ formatValue(pick(detail, ['Id'])) }}
            </el-descriptions-item>
            <el-descriptions-item label="线路">
              {{
                formatValue(
                  pick(detail, ['LineId_Name', 'Line_Name', 'LineName']),
                )
              }}
            </el-descriptions-item>
            <el-descriptions-item label="发车时间">
              {{
                formatValue(
                  pick(detail, [
                    'DepartureTime',
                    'DepartureTime_DateTime',
                    'StartTime',
                  ]),
                )
              }}
            </el-descriptions-item>
            <el-descriptions-item label="结束时间">
              {{ formatValue(pick(detail, ['EndTime'])) }}
            </el-descriptions-item>
            <el-descriptions-item label="车辆">
              {{
                formatValue(
                  pick(detail, ['VehicleId_Name', 'Vehicle_Name', 'VehicleNo']),
                )
              }}
            </el-descriptions-item>
            <el-descriptions-item label="司机">
              {{ formatValue(pick(detail, ['DriverId_Name', 'Driver_Name'])) }}
            </el-descriptions-item>
            <el-descriptions-item label="司机手机号">
              {{ formatValue(pick(detail, ['Driver_Phone'])) }}
            </el-descriptions-item>
            <el-descriptions-item label="上车人数">
              {{ formatValue(pick(detail, ['PersonNum'])) }}
            </el-descriptions-item>
            <el-descriptions-item label="总座位数">
              {{ formatValue(pick(detail, ['SeatTotal'])) }}
            </el-descriptions-item>
            <el-descriptions-item label="预约座位数">
              {{ formatValue(pick(detail, ['SeatSold'])) }}
            </el-descriptions-item>
            <el-descriptions-item label="优惠票价">
              {{ formatValue(pick(detail, ['TicketPrice'])) }}
            </el-descriptions-item>
            <el-descriptions-item label="基准票价">
              {{ formatValue(pick(detail, ['SitePrice'])) }}
            </el-descriptions-item>
            <el-descriptions-item label="开关">
              {{ formatValue(pick(detail, ['IsSale'])) }}
            </el-descriptions-item>
          </el-descriptions>
        </template>
        <el-empty
          v-else-if="!detailLoading"
          description="暂无运营详情"
          :image-size="80"
        />
      </div>
      <span slot="footer">
        <el-button size="small" @click="detailVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 修改订单弹窗 -->
    <el-dialog
      title="修改订单"
      :visible.sync="editVisible"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editForm"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
        size="mini"
      >
        <el-form-item label="线路" prop="LineId">
          <el-select
            v-model="editForm.LineId"
            filterable
            placeholder="选择线路"
            class="full"
          >
            <el-option
              v-for="item in lineList"
              :key="item.Id"
              :label="item.LineName"
              :value="item.Id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="司机" prop="DriverId">
          <el-input
            v-model="editForm.DriverId"
            placeholder="司机标识，如：300038-8831C83B8D2A40E48BE904AC0E944709"
          />
        </el-form-item>
        <el-form-item label="车辆" prop="VehicleId">
          <el-input-number
            v-model="editForm.VehicleId"
            :min="0"
            :controls="false"
            class="full"
          />
        </el-form-item>
        <el-form-item label="班次日期" prop="ScheduleDate">
          <el-date-picker
            v-model="editForm.ScheduleDate"
            type="date"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            class="full"
          />
        </el-form-item>
        <el-form-item label="发车时间" prop="DepartureTime">
          <el-date-picker
            v-model="editForm.DepartureTime"
            type="datetime"
            format="yyyy-MM-dd HH:mm:ss"
            value-format="yyyy-MM-dd HH:mm:ss"
            class="full"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="EndTime">
          <el-date-picker
            v-model="editForm.EndTime"
            type="datetime"
            format="yyyy-MM-dd HH:mm:ss"
            value-format="yyyy-MM-dd HH:mm:ss"
            class="full"
          />
        </el-form-item>
        <el-row :gutter="8">
          <el-col :span="12">
            <el-form-item label="基准票价" prop="SitePrice">
              <el-input-number
                v-model="editForm.SitePrice"
                :min="0"
                :precision="2"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优惠票价" prop="TicketPrice">
              <el-input-number
                v-model="editForm.TicketPrice"
                :min="0"
                :precision="2"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="8">
          <el-col :span="8">
            <el-form-item label="总座位数">
              <el-input-number
                v-model="editForm.SeatTotal"
                :min="0"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="已售座位">
              <el-input-number
                v-model="editForm.SeatSold"
                :min="0"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="上车人数">
              <el-input-number
                v-model="editForm.PersonNum"
                :min="0"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="售卖开关">
          <el-switch
            v-model="editForm.IsSale"
            active-text="开"
            inactive-text="关"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="editVisible = false">取消</el-button>
        <el-button
          type="primary"
          size="small"
          :loading="editSaving"
          @click="saveEdit"
          >保存</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { Message } from 'element-ui'
import request from '@/utils/request'
import {
  adultPriceOf as adultPrice,
  childPriceOf as childPrice,
} from '@/utils/price'

export default {
  name: 'BusOperations',
  data() {
    const now = new Date()
    const pad = (n) => (n < 10 ? '0' + n : '' + n)
    return {
      lineList: [],
      lineLoading: false,
      lineId: 1,
      today:
        now.getFullYear() +
        '-' +
        pad(now.getMonth() + 1) +
        '-' +
        pad(now.getDate()),

      list: [],
      listLoading: false,
      switchingId: null,
      // —— 详情 ——
      detailVisible: false,
      detailLoading: false,
      detail: null,
      detailRow: null,
      // —— 修改订单 ——
      editVisible: false,
      editSaving: false,
      editForm: {},
      editRules: {
        LineId: [
          { required: true, message: '请选择线路', trigger: 'change' },
        ],
        DriverId: [
          { required: true, message: '请填写司机标识', trigger: 'blur' },
        ],
        ScheduleDate: [
          { required: true, message: '请选择班次日期', trigger: 'change' },
        ],
        DepartureTime: [
          { required: true, message: '请选择发车时间', trigger: 'change' },
        ],
      },
    }
  },
  computed: {
    detailTitle() {
      const row = this.detailRow || {}
      const time = row.DepartureTime || row.StartTime || ''
      return (
        (row.LineId_Name || row.Line_Name || '运营') +
        (time ? ' ' + time : '') +
        ' - 运营详情'
      )
    },
  },
  mounted() {
    this.loadLines()
    this.loadList()
  },
  methods: {
    // 成人价 / 儿童价（规则见 @/utils/price）
    adultPriceOf: adultPrice,
    childPriceOf: childPrice,
    money(val) {
      const num = Number(val)
      return Number.isFinite(num) ? num.toFixed(2) : '0.00'
    },
    pick(obj, keys) {
      for (let i = 0; i < keys.length; i++) {
        const v = obj ? obj[keys[i]] : undefined
        if (v !== undefined && v !== null && v !== '') return v
      }
      return ''
    },
    isSaleOn(row) {
      return row.IsSale !== false && Number(row.IsSale) !== 0
    },
    formatValue(val) {
      if (val === null || val === undefined || val === '') return '-'
      if (typeof val === 'boolean') return val ? '是' : '否'
      if (typeof val === 'object') return JSON.stringify(val)
      return String(val)
    },
    // 路线下拉：GetBusLineList 全量
    async loadLines() {
      this.lineLoading = true
      try {
        const res = await request({
          url: '/BusOrder/GetBusLineList',
          method: 'get',
        })
        this.lineList = Array.isArray(res.data) ? res.data : []
      } catch (e) {
        this.lineList = []
      } finally {
        this.lineLoading = false
      }
    },
    // 运营时刻列表：GET /BusOrder/GetBusLineOperationsList?lineId=&today=
    async loadList() {
      this.listLoading = true
      try {
        const params = { today: this.today }
        if (this.lineId != null) params.lineId = this.lineId
        const res = await request({
          url: '/BusOrder/GetBusLineOperationsList',
          method: 'get',
          params,
        })
        const d = res.data
        this.list = Array.isArray(d)
          ? d
          : d && Array.isArray(d.data)
          ? d.data
          : d && Array.isArray(d.List)
          ? d.List
          : []
      } catch (e) {
        this.list = []
      } finally {
        this.listLoading = false
      }
    },
    // 售卖开关：GET /BusOrder/UpdateLineOpenState?Id=&IsSale=
    async handleSwitchSale(row, val) {
      this.switchingId = row.Id
      try {
        await request({
          url: '/BusOrder/UpdateLineOpenState',
          method: 'get',
          params: { Id: row.Id, IsSale: val },
        })
        row.IsSale = val
        row.IsSale_Name = val ? '售卖中' : '已停售'
        Message.success(val ? '已开启售卖' : '已停售')
      } catch (e) {
        // 失败保持原值，界面随响应式刷新回旧状态
        row.IsSale = !val
      } finally {
        this.switchingId = null
      }
    },
    // 详情：GET /BusOrder/GetDailyScheduleInfo?Id=
    async openDetail(row) {
      if (!row || !row.Id) return
      this.detailRow = row
      this.detailVisible = true
      this.detailLoading = true
      this.detail = null
      try {
        const res = await request({
          url: '/BusOrder/GetDailyScheduleInfo',
          method: 'get',
          params: { Id: row.Id },
        })
        this.detail = res.data || null
      } catch (e) {
        this.detail = null
      } finally {
        this.detailLoading = false
      }
    },
    // 修改订单：按列表行预填表单
    openEdit(row) {
      if (!row || !row.Id) return
      const dt = row.DepartureTime || row.StartTime || ''
      this.editForm = {
        Id: row.Id,
        LineId: row.LineId,
        DriverId: row.DriverId || '',
        VehicleId: row.VehicleId,
        ScheduleDate: row.ScheduleDate || String(dt).slice(0, 10),
        DepartureTime: dt ? this.normalizeTime(dt) : '',
        EndTime: row.EndTime ? this.normalizeTime(row.EndTime) : '',
        TicketPrice: Number(row.TicketPrice) || 0,
        SitePrice: Number(row.SitePrice) || 0,
        IsSale: this.isSaleOn(row),
        SeatTotal: Number(row.SeatTotal) || 0,
        SeatSold: Number(row.SeatSold) || 0,
        PersonNum: Number(row.PersonNum) || 0,
      }
      this.editVisible = true
      this.$nextTick(() => {
        if (this.$refs.editForm) this.$refs.editForm.clearValidate()
      })
    },
    // 统一时间格式为 yyyy-MM-dd HH:mm:ss
    normalizeTime(v) {
      const s = String(v).replace('T', ' ')
      return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s) ? s.slice(0, 19) : s
    },
    // 保存修改：POST /BusOrder/Update
    saveEdit() {
      this.$refs.editForm.validate(async (valid) => {
        if (!valid) return
        this.editSaving = true
        try {
          await request({
            url: '/BusOrder/Update',
            method: 'post',
            data: {
              LineId: this.editForm.LineId,
              DriverId: this.editForm.DriverId,
              VehicleId: this.editForm.VehicleId,
              ScheduleDate: this.editForm.ScheduleDate,
              DepartureTime: this.editForm.DepartureTime,
              TicketPrice: this.editForm.TicketPrice,
              SitePrice: this.editForm.SitePrice,
              IsSale: this.editForm.IsSale,
              SeatTotal: this.editForm.SeatTotal,
              SeatSold: this.editForm.SeatSold,
              EndTime: this.editForm.EndTime || null,
              PersonNum: this.editForm.PersonNum,
              Id: this.editForm.Id,
            },
          })
          Message.success('修改成功')
          this.editVisible = false
          this.loadList()
        } catch (e) {
          // 错误提示由 request 拦截器统一弹出
        } finally {
          this.editSaving = false
        }
      })
    },
    handleDetailClosed() {
      this.detail = null
      this.detailRow = null
      this.detailLoading = false
    },
  },
}
</script>

<style lang="scss" scoped>
.bus-operations {
  .panel {
    margin-bottom: 12px;
    padding: 12px;
    background: #fff;
    border-radius: $radius;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);

    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    &__title {
      font-size: 14px;
      font-weight: 600;
      color: $header-bg;
    }
    &__tip {
      font-size: 12px;
      color: #909399;
    }
  }

  .filter-bar {
    margin-bottom: 10px;
  }
  .line-filter {
    width: 200px;
  }
  .date-filter {
    width: 150px;
  }

  .detail-body {
    min-height: 160px;
    max-height: 66vh;
    overflow-y: auto;
    padding-right: 6px;
  }

  .full {
    width: 100%;
  }

  ::v-deep .el-descriptions-item__label {
    color: #909399;
  }
}
</style>
