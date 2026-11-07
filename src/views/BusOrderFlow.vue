<template>
  <div class="bus-order">
    <!-- ==================== 路线 + 日期 ==================== -->
    <div class="panel">
      <div class="panel__head">
        <span class="panel__title">大巴路线</span>
        <span class="panel__tip">可选日期：今天起 2 天内</span>
      </div>
      <el-form :inline="true" size="small">
        <el-form-item label="线路">
          <el-select
            v-model="routeId"
            filterable
            clearable
            placeholder="选择线路"
            class="line-select"
            @change="onRouteChange"
          >
            <el-option
              v-for="item in routes"
              :key="item.startId + ',' + item.endId"
              :label="item.startName + ' → ' + item.endName"
              :value="item.startId + ',' + item.endId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="路线">
          <el-select
            v-model="lineId"
            filterable
            clearable
            placeholder="选择路线"
            class="line-select"
            :loading="lineLoading"
            @change="searchSchedules"
          >
            <el-option
              v-for="item in lines"
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
            value-format="yyyy-MM-dd"
            placeholder="选择日期"
            :picker-options="datePickerOptions"
            class="line-select"
            @change="onDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="scheduleLoading"
            @click="searchSchedules"
            >查询班次</el-button
          >
          <el-button @click="loadRoutes">刷新路线</el-button>
        </el-form-item>
      </el-form>
      <!-- 热门站点：接口返回的 Bus_HotSiteList，多选作为 SearchSiteId 过滤班次 -->
      <div v-if="hotSites.length" class="hot-sites">
        <span class="hot-sites__label">热门站点：</span>
        <el-button
          v-for="site in hotSites"
          :key="site.Id"
          size="mini"
          class="hot-sites__btn"
          :type="isHotSiteActive(site) ? 'primary' : ''"
          @click="toggleHotSite(site)"
          >{{ site.Name }}</el-button
        >
      </div>
    </div>

    <!-- ==================== 班次 ==================== -->
    <div class="panel">
      <div class="panel__head">
        <span class="panel__title">
          班次
          <span class="panel__tip" v-if="currentLine.LineName">
            {{ currentLine.LineName }} · {{ today }}
          </span>
        </span>
      </div>
      <div v-loading="scheduleLoading" class="schedule-wrap">
        <div v-if="!schedules.length && !scheduleLoading" class="empty">
          {{
            lineId
              ? '该路线当天暂无可售班次，换个日期或路线试试'
              : '请先在上方选择路线和日期，点击「查询班次」'
          }}
        </div>
        <div v-else class="schedule-list">
          <div
            v-for="item in schedules"
            :key="item.Id"
            class="schedule-card"
            :class="{
              'is-disabled': !canBuy(item),
              'is-picked': schedule.Id === item.Id,
            }"
          >
            <div class="schedule-card__time">
              {{ (item.DepartureTime || '').slice(11, 16) }}
            </div>
            <div class="schedule-card__route">
              {{ item.StartSiteName || '-' }}
              <i class="el-icon-right"></i>
              {{ item.EndSiteName || '-' }}
            </div>
            <div class="schedule-card__meta">
              <span>余 {{ item.EmptySeat }} / {{ item.SeatTotal }} 座</span>
              <span class="price">成人 ¥ {{ money(adultPriceOf(item)) }}</span>
            </div>
            <div class="schedule-card__child">
              儿童 ¥ {{ money(childPriceOf(item)) }}
            </div>
            <div class="schedule-card__foot">
              <!-- <el-tag size="mini" type="info">{{
                item.IsStart_Name || '-'
              }}</el-tag> -->
              <el-button
                type="primary"
                size="mini"
                :disabled="!canBuy(item)"
                @click="pickSchedule(item)"
                >{{ schedule.Id === item.Id ? '已选择' : '选择' }}</el-button
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 选择上车站 / 下车站 ==================== -->
    <div class="panel">
      <div class="panel__head">
        <span class="panel__title">
          选择上下车站
          <span class="panel__tip" v-if="schedule.Id">
            {{ schedule.DepartureTime }}
          </span>
        </span>
      </div>
      <div v-loading="siteLoading" class="site-select-wrap">
        <div v-if="!schedule.Id" class="empty">请先在上方选择班次</div>
        <div
          v-else-if="
            !startSiteList.length && !endSiteList.length && !siteLoading
          "
          class="empty"
        >
          暂无站点信息，请重新选择班次
        </div>
        <el-form v-else :inline="true" size="small" class="site-form">
          <el-form-item label="上车站">
            <el-select
              v-model="boardSiteId"
              filterable
              placeholder="请选择上车站"
              class="site-select"
            >
              <el-option
                v-for="item in startSiteList"
                :key="item.LocationId"
                :label="
                  item.LocationName +
                  ' (' +
                  ' 计划发车时间 ' +
                  item.ArrivalTime +
                  ')'
                "
                :value="item.LocationId"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="下车站">
            <el-select
              v-model="alightSiteId"
              filterable
              placeholder="请选择下车站"
              class="site-select"
            >
              <el-option
                v-for="item in endSiteList"
                :key="item.LocationId"
                :label="
                  item.LocationName +
                  ' (' +
                  ' 计划到达时间 ' +
                  item.ArrivalTime +
                  ')'
                "
                :value="item.LocationId"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- ==================== 乘车人 ==================== -->
    <div class="panel">
      <div class="panel__head">
        <span class="panel__title">
          乘车人（{{ passengers.length }} 人，姓名/电话/身份证必填）
        </span>
        <el-button type="text" size="mini" @click="addPassenger"
          >+ 添加乘车人</el-button
        >
      </div>
      <div v-if="!schedule.Id || !boardSiteId || !alightSiteId" class="empty">
        请先在上方选择班次和上下车站
      </div>
      <template v-else>
        <div class="schedule-summary">
          <span class="strong">{{ currentLine.LineName }}</span>
          <span>{{ schedule.DepartureTime }}</span>
          <span>
            {{ boardSiteName }}
            <i class="el-icon-right"></i>
            {{ alightSiteName }}
          </span>
          <span class="price"
            >成人 ¥ {{ money(scheduleAdultPrice) }}/人 · 儿童 ¥
            {{ money(scheduleChildPrice) }}/人</span
          >
        </div>
        <div v-for="(item, index) in passengers" :key="index" class="pax-row">
          <span class="pax-row__index">{{ index + 1 }}</span>
          <el-input
            v-model="item.Name"
            size="mini"
            placeholder="姓名（必填）"
            class="pax-row__name"
          />
          <el-input
            v-model="item.Phone"
            size="mini"
            maxlength="11"
            placeholder="手机号（必填）"
            class="pax-row__phone"
          />
          <el-input
            v-model="item.IdCard"
            size="mini"
            maxlength="18"
            placeholder="身份证号（必填）"
            class="pax-row__idcard"
            :class="{ 'is-error': item.idCardError }"
            @blur="validateIdCard(item)"
            @input="item.idCardError = ''"
          />
          <span v-if="item.idCardError" class="pax-row__err">{{
            item.idCardError
          }}</span>
          <el-select v-model="item.isChild" size="mini" class="pax-row__type">
            <el-option label="成人" :value="false" />
            <el-option label="儿童" :value="true" />
          </el-select>
          <span class="pax-row__price"
            >¥{{
              money(item.isChild ? scheduleChildPrice : scheduleAdultPrice)
            }}</span
          >
          <el-button
            type="text"
            size="mini"
            class="danger-text"
            :disabled="passengers.length === 1"
            @click="removePassenger(index)"
            >删除</el-button
          >
        </div>
      </template>
    </div>

    <!-- ==================== 联系人 & 提交 ==================== -->
    <div class="panel">
      <div class="panel__title">联系人 & 提交</div>
      <el-form label-width="110px" size="mini" class="confirm-form">
        <el-form-item label="联系人电话" required>
          <el-input
            v-model="contactPhone"
            maxlength="11"
            placeholder="订单联系人手机号"
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="remark" placeholder="选填" class="form-input" />
        </el-form-item>
        <el-form-item label="合计">
          <span class="total" v-if="schedule.Id"
            >¥ {{ money(orderTotal) }}</span
          >
          <span class="total" v-else>¥ 0.00</span>
          <span class="panel__tip" v-if="schedule.Id">
            （成人 ¥{{ money(scheduleAdultPrice) }} × {{ adultCount
            }}<template v-if="childCount">
              · 儿童 ¥{{ money(scheduleChildPrice) }} ×
              {{ childCount }} </template
            >）
          </span>
        </el-form-item>
      </el-form>
      <div class="submit-bar">
        <el-button @click="resetFlow">重新开始</el-button>
        <el-button type="primary" :loading="submitting" @click="submitOrder"
          >提交订单</el-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import { Message } from 'element-ui'
import request from '@/utils/request'
import {
  adultPriceOf as adultPrice,
  childPriceOf as childPrice,
} from '@/utils/price'

const pad = (n) => (n < 10 ? '0' + n : '' + n)
const formatDate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

// 接口返回的列表可能是数组，也可能包在 List/data/rows 等字段里，统一取成数组
const toArray = (d) => {
  if (Array.isArray(d)) return d
  if (!d || typeof d !== 'object') return []
  const keys = [
    'List',
    'list',
    'data',
    'Data',
    'rows',
    'Rows',
    'items',
    'Items',
  ]
  for (let i = 0; i < keys.length; i++) {
    if (Array.isArray(d[keys[i]])) return d[keys[i]]
  }
  return []
}

// 18 位身份证：GB11643 校验码验证（前 17 位加权求和 mod 11 对照表）
const ID_CARD_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const ID_CARD_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
function isValidIdCard(idCard) {
  const s = String(idCard || '')
    .trim()
    .toUpperCase()
  if (!/^\d{17}[\dX]$/.test(s)) return false
  // 出生日期合法性
  const year = +s.slice(6, 10)
  const month = +s.slice(10, 12)
  const day = +s.slice(12, 14)
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const birth = new Date(year, month - 1, day)
  if (
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day
  ) {
    return false
  }
  let sum = 0
  for (let i = 0; i < 17; i++) sum += Number(s[i]) * ID_CARD_WEIGHTS[i]
  return ID_CARD_CODES[sum % 11] === s[17]
}

export default {
  name: 'BusOrderFlow',
  data() {
    return {
      routes: [], // 热门路线（起点→终点）
      routeId: '1,6', // 当前路线：startId,endId，默认 太原→文水
      lines: [], // 当前路线下的线路（接口 BuslineList）
      hotSites: [], // 热门站点（接口 Bus_HotSiteList）
      selectedSiteIds: [], // 已勾选的热门站点 Id，作为 SearchSiteId 查班次
      lineId: null,
      lineLoading: false,
      today: formatDate(new Date()),
      // 日期只允许 今天 ~ 今天+3 天
      datePickerOptions: {
        disabledDate(time) {
          const start = new Date()
          start.setHours(0, 0, 0, 0)
          const end = new Date()
          end.setDate(end.getDate() + 1)
          end.setHours(23, 59, 59, 999)
          return (
            time.getTime() < start.getTime() || time.getTime() > end.getTime()
          )
        },
      },
      schedules: [],
      scheduleLoading: false,
      schedule: {},
      startSiteList: [],
      endSiteList: [],
      siteLoading: false,
      boardSiteId: null,
      alightSiteId: null,
      passengers: [
        { Name: '', Phone: '', IdCard: '', idCardError: '', isChild: false },
      ],
      contactPhone: '',
      remark: '',
      submitting: false,
    }
  },
  computed: {
    currentLine() {
      const list = Array.isArray(this.lines) ? this.lines : []
      return list.find((item) => item.Id === this.lineId) || {}
    },
    boardSiteName() {
      const site = this.startSiteList.find(
        (s) => (s.Id || s.SiteId) === this.boardSiteId,
      )
      return site ? site.LocationName || site.SiteName || site.Name : '-'
    },
    alightSiteName() {
      const site = this.endSiteList.find(
        (s) => (s.Id || s.SiteId) === this.alightSiteId,
      )
      return site ? site.LocationName || site.SiteName || site.Name : '-'
    },
    // 成人票价：有优惠价用优惠价，否则用原价
    scheduleAdultPrice() {
      return this.adultPriceOf(this.schedule)
    },
    // 儿童价：成人原价一半与成人优惠价取低（原价缺失时按成人票价一半兜底）
    scheduleChildPrice() {
      return this.childPriceOf(this.schedule)
    },
    adultCount() {
      return this.passengers.filter((p) => !p.isChild).length
    },
    childCount() {
      return this.passengers.filter((p) => p.isChild).length
    },
    orderTotal() {
      const total =
        this.adultCount * this.scheduleAdultPrice +
        this.childCount * this.scheduleChildPrice
      return Math.round(total * 100) / 100
    },
  },
  created() {
    this.loadRoutes()
  },
  methods: {
    money(val) {
      const num = Number(val)
      return Number.isFinite(num) ? num.toFixed(2) : '0.00'
    },
    canBuy(item) {
      return item && Number(item.EmptySeat) > 0
    },
    // 成人票价 / 儿童票价（规则见 @/utils/price）
    adultPriceOf: adultPrice,
    childPriceOf: childPrice,
    // 热门路线：默认选第一条，加载完自动请求该路线下的线路
    async loadRoutes() {
      try {
        const res = await request({
          url: '/api/BusMobile/GetHotLineCityList',
          method: 'get',
        })
        this.routes = toArray(res.data)
      } catch (e) {
        this.routes = []
      }
      // 默认停在 1,6（太原→文水）；列表里没有该路线时退回第一条
      if (this.routes.length) {
        const hit = this.routes.find((r) => r.startId + ',' + r.endId === '1,6')
        const first = hit || this.routes[0]
        this.routeId = first.startId + ',' + first.endId
      } else {
        this.routeId = '1,6'
      }
      await this.loadLines()
    },
    // 路线切换：重置线路并重新加载
    onRouteChange() {
      this.lineId = null
      this.lines = []
      this.schedules = []
      this.schedule = {}
      this.loadLines()
    },
    // 日期变化：按新日期重新加载线路（不影响已选路线）
    onDateChange() {
      if (!this.today) {
        this.today = formatDate(new Date())
      }
      this.loadLines()
    },
    // 当前路线下的线路：只加载列表与热门站点，不默认选中
    async loadLines() {
      if (!this.routeId) {
        this.lines = []
        return
      }
      this.lineLoading = true
      try {
        const res = await request({
          url: '/BusOrder/GetBusLineListByCity',
          method: 'get',
          params: { citys: this.routeId, today: this.today },
        })
        const d = res.data || {}
        // 接口结构：data.BuslineList 为线路列表，data.Bus_HotSiteList 为热门站点
        this.lines = toArray(d.BuslineList || d.buslineList || d)
        this.hotSites = toArray(d.Bus_HotSiteList || d.busHotSiteList)
      } catch (e) {
        this.lines = []
        this.hotSites = []
      } finally {
        this.lineLoading = false
      }
      // 路线不默认选中，由用户手动选择后再查班次；筛选条件一并清空
      this.lineId = null
      this.selectedSiteIds = []
      this.schedules = []
      this.schedule = {}
    },
    // 热门站点是否已勾选
    isHotSiteActive(site) {
      return this.selectedSiteIds.indexOf(site.Id) > -1
    },
    // 点击热门站点：切换勾选，并按新筛选重查班次（清掉已选班次/上下车点）
    toggleHotSite(site) {
      const idx = this.selectedSiteIds.indexOf(site.Id)
      if (idx > -1) {
        this.selectedSiteIds.splice(idx, 1)
      } else {
        this.selectedSiteIds.push(site.Id)
      }
      this.schedule = {}
      this.boardSiteId = null
      this.alightSiteId = null
      this.startSiteList = []
      this.endSiteList = []
      if (this.lineId) this.searchSchedules()
    },
    // 路线运营时刻：POST /BusOrder/GetBusIndexLineList
    // 参数：citys=路线(城市对) today=日期 SearchSiteId=热门站点(逗号串) BusLineId=线路Id
    // 返回：data.Bus_ShiftList 为班次列表
    async searchSchedules() {
      if (!this.lineId) {
        Message.warning('请选择线路')
        return
      }
      if (!this.today) {
        Message.warning('请选择出发日期')
        return
      }
      this.scheduleLoading = true
      try {
        const res = await request({
          url: '/BusOrder/GetBusIndexLineList',
          method: 'post',
          data: {
            citys: this.routeId,
            today: this.today,
            SearchSiteId: this.selectedSiteIds.join(',') || null,
            BusLineId: this.lineId,
          },
        })
        const d = res.data || {}
        this.schedules = d.Bus_ShiftList
      } catch (e) {
        this.schedules = []
      } finally {
        this.scheduleLoading = false
      }
    },
    // 选班次 → 获取站点列表（单页内直接往下接着选站点）
    async pickSchedule(item) {
      this.schedule = item
      this.boardSiteId = null
      this.alightSiteId = null
      await this.fetchSiteList()
    },
    // 调用接口获取路线站点信息
    async fetchSiteList() {
      this.siteLoading = true
      try {
        const res = await request({
          url: '/api/BusMobile/GetBusLineSiteTimeInfo',
          method: 'post',
          data: {
            ScheduleId: this.schedule.Id,
            LineId: String(this.lineId),
            DepartureTime: this.schedule.DepartureTime,
          },
        })
        console.log('站点信息', res)
        const siteData = res.data || {}
        this.startSiteList = toArray(
          siteData.StartSiteList || siteData.startSiteList,
        )
        this.endSiteList = toArray(siteData.EndSiteList || siteData.endSiteList)
      } catch (e) {
        this.startSiteList = []
        this.endSiteList = []
      } finally {
        this.siteLoading = false
      }
    },
    addPassenger() {
      this.passengers.push({
        Name: '',
        Phone: '',
        IdCard: '',
        idCardError: '',
        isChild: false,
      })
    },
    removePassenger(index) {
      if (this.passengers.length === 1) return
      this.passengers.splice(index, 1)
    },
    // 身份证即时校验（失焦触发）：必填 + 18 位格式/出生日期/校验码
    validateIdCard(item) {
      const v = String(item.IdCard || '').trim()
      if (!v) {
        item.idCardError = '请填写身份证号'
      } else if (!isValidIdCard(v)) {
        item.idCardError = '身份证号不正确'
      } else {
        item.idCardError = ''
      }
      return !item.idCardError
    },
    validate() {
      const line = this.currentLine
      if (!line.Id) {
        Message.warning('请选择路线')
        return false
      }
      if (!this.schedule || !this.schedule.Id) {
        Message.warning('请选择班次')
        return false
      }
      if (!this.boardSiteId || !this.alightSiteId) {
        Message.warning('请选择上车站和下车站')
        return false
      }
      if (this.boardSiteId === this.alightSiteId) {
        Message.warning('上车站和下车站不能相同')
        return false
      }
      const phoneRe = /^1[3-9]\d{9}$/
      for (let i = 0; i < this.passengers.length; i++) {
        const p = this.passengers[i]
        if (!p.Name || !String(p.Name).trim()) {
          Message.warning(`第 ${i + 1} 位乘车人还没填姓名`)
          return false
        }
        if (!phoneRe.test(String(p.Phone || '').trim())) {
          Message.warning(`第 ${i + 1} 位乘车人的手机号不正确`)
          return false
        }
        // 身份证必填（18 位格式 + 出生日期 + 校验码），同时刷新行内错误提示
        if (!this.validateIdCard(p)) {
          Message.warning(`第 ${i + 1} 位乘车人的${p.idCardError}`)
          return false
        }
      }
      if (!phoneRe.test(String(this.contactPhone || '').trim())) {
        Message.warning('请填写正确的订单联系人电话')
        return false
      }
      return true
    },
    async submitOrder() {
      if (!this.validate()) return
      const line = this.currentLine
      const personalIds = this.passengers
        .map(
          (p) =>
            `${String(p.Name).trim()}|${String(p.Phone).trim()}|${String(
              p.IdCard || '',
            ).trim()}`,
        )
        .join(',')
      this.submitting = true
      try {
        const res = await request({
          url: '/BusOrder/Create',
          method: 'post',
          data: {
            LineId: String(line.Id),
            ArrivalTime: this.schedule.DepartureTime,
            ScheduleId: this.schedule.Id,
            PassengerPhone: String(this.contactPhone).trim(),
            PersonalIds: personalIds,
            Remark: this.remark || '',
            StatingLocation: this.boardSiteId,
            EndLocation: this.alightSiteId,
          },
        })
        const orderNo = res.data && (res.data.OrderNo || res.data)
        Message.success(
          orderNo ? `下单成功，订单号：${orderNo}` : res.msg || '下单成功',
        )
        this.resetFlow()
      } catch (e) {
        // 错误提示由 request 拦截器统一弹出
      } finally {
        this.submitting = false
      }
    },
    resetFlow() {
      this.schedules = []
      this.schedule = {}
      this.startSiteList = []
      this.endSiteList = []
      this.boardSiteId = null
      this.alightSiteId = null
      this.passengers = [
        { Name: '', Phone: '', IdCard: '', idCardError: '', isChild: false },
      ]
      this.contactPhone = ''
      this.remark = ''
    },
  },
}
</script>

<style lang="scss" scoped>
.bus-order {
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
      margin-left: 8px;
      font-size: 12px;
      font-weight: 400;
      color: #909399;
    }
  }

  .line-select {
    width: 200px;
  }

  // 热门站点按钮行（位于路线/线路/日期筛选行下方）
  .hot-sites {
    margin-top: -6px;
    padding-bottom: 2px;
    line-height: 28px;

    &__label {
      font-size: 13px;
      color: #909399;
    }
    &__btn {
      margin: 0 8px 6px 0;
    }
  }

  .schedule-wrap {
    min-height: 120px;
  }
  .empty {
    padding: 40px 0;
    text-align: center;
    font-size: 13px;
    color: #909399;
  }
  .schedule-list {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -6px;
  }
  .schedule-card {
    width: 220px;
    margin: 6px;
    padding: 12px;
    border: 1px solid #ebeef5;
    border-radius: $radius;
    box-sizing: border-box;

    &.is-disabled {
      opacity: 0.55;
    }
    &.is-picked {
      border-color: #409eff;
      box-shadow: 0 0 0 1px #409eff inset;
    }

    &__time {
      font-size: 18px;
      font-weight: 600;
      color: $header-bg;
    }
    &__route {
      margin: 6px 0;
      font-size: 13px;
      color: #606266;

      .el-icon-right {
        margin: 0 4px;
        color: #c0c4cc;
      }
    }
    &__child {
      margin-top: 2px;
      font-size: 12px;
      color: #909399;
    }
    &__meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: #909399;

      .price {
        font-size: 15px;
        font-weight: 600;
        color: $danger;
      }
    }
    &__foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;
    }
  }

  .schedule-summary {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 12px;
    padding: 10px 12px;
    background: #f5f7fa;
    border-radius: $radius;
    font-size: 13px;
    color: #606266;

    span + span {
      margin-left: 16px;
    }
    .strong {
      font-size: 16px;
      font-weight: 600;
      color: $header-bg;
    }
    .price {
      font-weight: 600;
      color: $danger;
    }
  }

  .site-select-wrap {
    min-height: 80px;
  }
  .site-form {
    margin-bottom: 8px;
  }
  .site-select {
    width: 220px;
  }

  .pax-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    &__index {
      width: 20px;
      margin-right: 6px;
      font-size: 12px;
      color: #909399;
      text-align: center;
    }
    &__name {
      width: 150px;
      margin-right: 8px;
    }
    &__phone {
      width: 160px;
      margin-right: 8px;
    }
    &__type {
      width: 84px;
      margin-right: 8px;
    }
    &__price {
      min-width: 62px;
      margin-right: 8px;
      font-size: 13px;
      font-weight: 600;
      color: $danger;
      text-align: right;
    }
    &__idcard {
      width: 240px;
      margin-right: 8px;

      &.is-error ::v-deep .el-input__inner {
        border-color: $danger;
      }
    }
    &__err {
      margin-left: 8px;
      font-size: 12px;
      color: $danger;
      white-space: nowrap;
    }
  }

  .form-input {
    width: 320px;
  }
  .total {
    font-size: 18px;
    font-weight: 600;
    color: $danger;
  }
  .submit-bar {
    display: flex;
    justify-content: flex-end;
    padding-top: 4px;
  }
  ::v-deep .danger-text {
    color: $danger;
  }
}
</style>
