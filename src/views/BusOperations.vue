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
            v-model="lineIds"
            multiple
            collapse-tags
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
        <el-form-item label="司机">
          <el-select
            v-model="driverIds"
            multiple
            collapse-tags
            filterable
            clearable
            placeholder="全部司机"
            class="filter"
            :loading="dictLoading"
            @change="loadList"
          >
            <el-option
              v-for="item in driverList"
              :key="item.Id"
              :label="item.Name || item.DriverName"
              :value="item.Id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="车辆">
          <el-select
            v-model="carIds"
            multiple
            collapse-tags
            filterable
            clearable
            placeholder="全部车辆"
            class="filter"
            :loading="dictLoading"
            @change="loadList"
          >
            <el-option
              v-for="item in carList"
              :key="item.Id"
              :label="item.VehicleNo || item.CarNo || item.Name"
              :value="item.Id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="loadList"
            >查询</el-button
          >
          <el-button icon="el-icon-close" @click="clearFilters">清除</el-button>
          <el-button
            type="warning"
            icon="el-icon-user"
            :disabled="!selectedRows.length"
            @click="openChangeDriver"
            >班次换司机{{
              selectedRows.length ? '（' + selectedRows.length + '）' : ''
            }}</el-button
          >
          <el-button type="danger" icon="el-icon-sort" @click="openSwap"
            >司机对调</el-button
          >
        </el-form-item>
      </el-form>

      <el-table
        ref="opTable"
        v-loading="listLoading"
        :data="list"
        border
        size="mini"
        style="width: 100%"
        empty-text="暂无运营班次"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="46" align="center" />
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
        <el-table-column label="原始司机" min-width="120" align="center">
          <template slot-scope="scope">
            {{ pick(scope.row, ['PlanDriver_Name']) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="实际司机" min-width="120" align="center">
          <template slot-scope="scope">
            {{ pick(scope.row, ['Driver_Name']) || '-' }}
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

      <div class="pager-bar">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="pageSize"
          :current-page="pageIndex"
          :page-sizes="[10, 20, 50]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 班次换司机弹窗 -->
    <el-dialog
      title="班次换司机"
      :visible.sync="driverDialogVisible"
      width="420px"
      :close-on-click-modal="false"
    >
      <div class="change-driver-tip">
        已选 <b>{{ selectedRows.length }}</b> 个班次，将把它们的司机统一换成：
      </div>
      <el-select
        v-model="changeDriverId"
        filterable
        placeholder="请选择司机"
        class="change-driver-select"
        :loading="dictLoading"
      >
        <el-option
          v-for="item in driverList"
          :key="item.Id"
          :label="item.Name || item.DriverName"
          :value="item.Id"
        />
      </el-select>
      <span slot="footer">
        <el-button size="mini" @click="driverDialogVisible = false"
          >取消</el-button
        >
        <el-button
          type="primary"
          size="mini"
          :loading="driverDialogSaving"
          @click="submitChangeDriver"
          >确定</el-button
        >
      </span>
    </el-dialog>

    <!-- 司机班次对调弹窗 -->
    <el-dialog
      title="司机班次对调"
      :visible.sync="swapVisible"
      width="980px"
      top="6vh"
      :close-on-click-modal="false"
    >
      <div class="swap-tip">
        日期：{{ today }} ——
        左右各自选择司机与班次，点击“确认对调”后两边的司机互换
      </div>
      <div class="swap-body">
        <div class="swap-col">
          <el-select
            v-model="swapLeftDriverId"
            filterable
            clearable
            placeholder="左侧司机（可输入筛选）"
            class="swap-driver"
            :loading="dictLoading"
            @change="loadSwapSide('left')"
          >
            <el-option
              v-for="item in driverList"
              :key="item.Id"
              :label="item.Name || item.DriverName"
              :value="item.Id"
            />
          </el-select>
          <el-table
            v-loading="swapLeftLoading"
            :data="swapLeftList"
            border
            size="mini"
            height="300"
            empty-text="该司机当天暂无班次"
            @selection-change="onSwapLeftSelect"
          >
            <el-table-column type="selection" width="42" align="center" />
            <el-table-column label="发车时间" width="170" align="center">
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
                  pick(scope.row, ['LineId_Name', 'Line_Name', 'LineName']) ||
                  '-'
                }}
              </template>
            </el-table-column>
          </el-table>
          <div class="swap-count">
            左侧已选 {{ swapLeftRows.length }} 个班次
          </div>
        </div>

        <div class="swap-arrow">⇄</div>

        <div class="swap-col">
          <el-select
            v-model="swapRightDriverId"
            filterable
            clearable
            placeholder="右侧司机（可输入筛选）"
            class="swap-driver"
            :loading="dictLoading"
            @change="loadSwapSide('right')"
          >
            <el-option
              v-for="item in driverList"
              :key="'r-' + item.Id"
              :label="item.Name || item.DriverName"
              :value="item.Id"
            />
          </el-select>
          <el-table
            v-loading="swapRightLoading"
            :data="swapRightList"
            border
            size="mini"
            height="300"
            empty-text="该司机当天暂无班次"
            @selection-change="onSwapRightSelect"
          >
            <el-table-column type="selection" width="42" align="center" />
            <el-table-column label="发车时间" width="170" align="center">
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
                  pick(scope.row, ['LineId_Name', 'Line_Name', 'LineName']) ||
                  '-'
                }}
              </template>
            </el-table-column>
          </el-table>
          <div class="swap-count">
            右侧已选 {{ swapRightRows.length }} 个班次
          </div>
        </div>
      </div>
      <span slot="footer">
        <el-button size="mini" @click="swapVisible = false">取消</el-button>
        <el-button
          type="primary"
          size="mini"
          :loading="swapSaving"
          @click="submitSwap"
          >确认对调</el-button
        >
      </span>
    </el-dialog>

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
          <el-select
            v-model="editForm.DriverId"
            filterable
            clearable
            placeholder="选择司机"
            class="full"
            :loading="dictLoading"
          >
            <el-option
              v-for="item in driverList"
              :key="item.Id"
              :label="item.Name || item.DriverName"
              :value="item.Id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="车辆" prop="VehicleId">
          <el-select
            v-model="editForm.VehicleId"
            filterable
            clearable
            placeholder="选择车辆"
            class="full"
            :loading="dictLoading"
          >
            <el-option
              v-for="item in carList"
              :key="item.Id"
              :label="item.VehicleNo || item.CarNo || item.Name"
              :value="item.Id"
            />
          </el-select>
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
      lineIds: [],
      driverIds: [],
      carIds: [],
      driverList: [],
      carList: [],
      dictLoading: false,
      today:
        now.getFullYear() +
        '-' +
        pad(now.getMonth() + 1) +
        '-' +
        pad(now.getDate()),

      list: [],
      // 分页：接口返回当天全量，前端切片
      allList: [],
      total: 0,
      pageIndex: 1,
      pageSize: 10,
      listLoading: false,
      switchingId: null,
      // —— 勾选 + 班次换司机 ——
      selectedRows: [],
      driverDialogVisible: false,
      driverDialogSaving: false,
      changeDriverId: null,
      // —— 司机对调 ——
      swapVisible: false,
      swapSaving: false,
      swapLeftDriverId: null,
      swapRightDriverId: null,
      swapLeftList: [],
      swapRightList: [],
      swapLeftRows: [],
      swapRightRows: [],
      swapLeftLoading: false,
      swapRightLoading: false,
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
        LineId: [{ required: true, message: '请选择线路', trigger: 'change' }],
        DriverId: [
          { required: true, message: '请选择司机', trigger: 'change' },
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
    this.loadDicts()
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
    // 司机 / 车辆字典：GetBusDriverList + GetBusCarList
    async loadDicts() {
      this.dictLoading = true
      try {
        const [driverRes, carRes] = await Promise.all([
          request({
            url: '/BusOrder/GetBusDriverList',
            method: 'post',
            data: {},
            silent: true,
          }).catch(() => null),
          request({
            url: '/BusOrder/GetBusCarList',
            method: 'post',
            data: {},
            silent: true,
          }).catch(() => null),
        ])
        const toList = (res) => {
          if (!res) return []
          const d = res.data
          if (!d) return []
          if (Array.isArray(d)) return d
          if (Array.isArray(d.data)) return d.data
          if (Array.isArray(d.List)) return d.List
          return []
        }
        this.driverList = toList(driverRes)
        this.carList = toList(carRes)
      } finally {
        this.dictLoading = false
      }
    },
    // 清除路线 / 司机 / 车辆筛选，日期保留
    clearFilters() {
      this.lineIds = []
      this.driverIds = []
      this.carIds = []
      this.loadList()
    },
    // 运营时刻列表：GET /BusOrder/GetBusLineOperationsList?lineId=&today=&driverId=&carId=
    async loadList() {
      this.listLoading = true
      this.selectedRows = []
      if (this.$refs.opTable) this.$refs.opTable.clearSelection()
      try {
        const params = { today: this.today }
        if (this.lineIds && this.lineIds.length)
          params.lineId = this.lineIds.join(',')
        if (this.driverIds && this.driverIds.length)
          params.driverId = this.driverIds.join(',')
        if (this.carIds && this.carIds.length)
          params.carId = this.carIds.join(',')
        const res = await request({
          url: '/BusOrder/GetBusLineOperationsList',
          method: 'get',
          params,
        })
        const d = res.data
        const rows = Array.isArray(d)
          ? d
          : d && Array.isArray(d.data)
          ? d.data
          : d && Array.isArray(d.List)
          ? d.List
          : []
        this.allList = rows
        this.total = rows.length
        this.pageIndex = 1
        this.applyPage()
      } catch (e) {
        this.allList = []
        this.total = 0
        this.pageIndex = 1
        this.applyPage()
      } finally {
        this.listLoading = false
      }
    },
    // 前端分页：按 pageIndex/pageSize 切片
    applyPage() {
      const start = (this.pageIndex - 1) * this.pageSize
      this.list = this.allList.slice(start, start + this.pageSize)
      this.selectedRows = []
      if (this.$refs.opTable) this.$refs.opTable.clearSelection()
    },
    handlePageChange(page) {
      this.pageIndex = page
      this.applyPage()
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.pageIndex = 1
      this.applyPage()
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
    // ==================== 勾选 + 班次换司机 ====================
    onSelectionChange(rows) {
      this.selectedRows = rows || []
    },
    openChangeDriver() {
      if (!this.selectedRows.length) {
        Message.warning('请先勾选要换司机的班次')
        return
      }
      this.changeDriverId = null
      this.driverDialogVisible = true
    },
    // POST /BusOrder/UpdateDriver  { Ids: [...], DriverId }
    async submitChangeDriver() {
      if (!this.changeDriverId) {
        Message.warning('请选择司机')
        return
      }
      this.driverDialogSaving = true
      try {
        await request({
          url: '/BusOrder/UpdateDriver',
          method: 'post',
          data: {
            Ids: this.selectedRows.map((r) => r.Id),
            DriverId: this.changeDriverId,
          },
        })
        Message.success('换司机成功')
        this.driverDialogVisible = false
        this.selectedRows = []
        if (this.$refs.opTable) this.$refs.opTable.clearSelection()
        this.loadList()
      } catch (e) {
        // 错误提示由 request 拦截器统一弹出
      } finally {
        this.driverDialogSaving = false
      }
    },
    // ==================== 司机班次对调 ====================
    onSwapLeftSelect(rows) {
      this.swapLeftRows = rows || []
    },
    onSwapRightSelect(rows) {
      this.swapRightRows = rows || []
    },
    openSwap() {
      this.swapLeftDriverId = null
      this.swapRightDriverId = null
      this.swapLeftList = []
      this.swapRightList = []
      this.swapLeftRows = []
      this.swapRightRows = []
      this.swapVisible = true
    },
    // 按司机拉取当天班次（复用运营时刻列表接口）
    async loadSwapSide(side) {
      const isLeft = side === 'left'
      const driverId = isLeft ? this.swapLeftDriverId : this.swapRightDriverId
      const listKey = isLeft ? 'swapLeftList' : 'swapRightList'
      const rowsKey = isLeft ? 'swapLeftRows' : 'swapRightRows'
      const loadingKey = isLeft ? 'swapLeftLoading' : 'swapRightLoading'
      this[rowsKey] = []
      this[listKey] = []
      if (driverId == null || driverId === '') return
      this[loadingKey] = true
      try {
        const params = { today: this.today, driverId }
        if (this.lineIds && this.lineIds.length)
          params.lineId = this.lineIds.join(',')
        const res = await request({
          url: '/BusOrder/GetBusLineOperationsList',
          method: 'get',
          params,
          silent: true,
        })
        const d = res.data
        this[listKey] = Array.isArray(d)
          ? d
          : d && Array.isArray(d.data)
          ? d.data
          : d && Array.isArray(d.List)
          ? d.List
          : []
      } catch (e) {
        this[listKey] = []
      } finally {
        this[loadingKey] = false
      }
    },
    // POST /BusOrder/UpdateDriverSwap { Ids, DriverId, ActualDriverId }
    async submitSwap() {
      const left = this.swapLeftRows || []
      const right = this.swapRightRows || []
      if (!this.swapLeftDriverId || !this.swapRightDriverId) {
        Message.warning('左右两侧都要选择司机')
        return
      }
      if (this.swapLeftDriverId === this.swapRightDriverId) {
        Message.warning('左右不能选择同一个司机')
        return
      }
      if (!left.length || !right.length) {
        Message.warning('左右两侧都要勾选要对调的班次')
        return
      }
      try {
        await this.$confirm(
          `确认将左侧 ${left.length} 个班次与右侧 ${right.length} 个班次的司机对调吗？`,
          '确认对调',
          {
            type: 'warning',
            confirmButtonText: '确认对调',
            cancelButtonText: '取消',
          },
        )
      } catch (e) {
        return
      }
      this.swapSaving = true
      try {
        await request({
          url: '/BusOrder/UpdateDriverSwap',
          method: 'post',
          data: {
            Ids: left.concat(right).map((r) => r.Id),
            DriverId: this.swapLeftDriverId,
            ActualDriverId: this.swapRightDriverId,
          },
        })
        Message.success('司机对调成功')
        this.swapVisible = false
        this.loadList()
      } catch (e) {
        // 错误提示由 request 拦截器统一弹出
      } finally {
        this.swapSaving = false
      }
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
  .filter {
    width: 180px;
  }

  .change-driver-tip {
    margin-bottom: 12px;
    font-size: 13px;
    line-height: 1.6;
    color: #606266;

    b {
      color: #e6a23c;
    }
  }
  .change-driver-select {
    width: 100%;
  }

  .pager-bar {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
  }

  /* 司机对调 */
  .swap-tip {
    margin-bottom: 10px;
    font-size: 12px;
    color: #909399;
  }
  .swap-body {
    display: flex;
    align-items: stretch;
  }
  .swap-col {
    flex: 1;
    min-width: 0;
  }
  .swap-driver {
    width: 100%;
    margin-bottom: 8px;
  }
  .swap-arrow {
    flex: 0 0 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #e6a23c;
  }
  .swap-count {
    margin-top: 6px;
    font-size: 12px;
    color: #606266;
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
