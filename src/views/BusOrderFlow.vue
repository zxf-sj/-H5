<template>
  <div class="bus-order">
    <div class="flow-layout">
      <div class="flow-main">
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
            @change="onLineChange"
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
          <span class="panel__tip" v-if="orderLine.LineName">
            {{ orderLine.LineName }} · {{ today }}
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
              <span class="price">票价 ¥ {{ item.TicketPrice }}</span>
            </div>
            <div class="schedule-card__child">原价 ¥ {{ item.SitePrice }}</div>
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
          <span class="strong">{{ orderLine.LineName || '-' }}</span>
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

      <!-- ==================== 右侧：站点地图 ==================== -->
      <div class="flow-map">
        <div class="panel site-map-panel">
          <div class="panel__head">
            <span class="panel__title"
              >站点地图（共 {{ siteMapSites.length }} 个）</span
            >
          </div>
          <div class="site-map-tools">
            <el-input
              v-model="placeKeyword"
              size="mini"
              placeholder="搜索地点 / 地址，回车检索"
              clearable
              @keyup.enter.native="searchPlace"
              @clear="placeResults = []"
            />
            <el-button
              type="primary"
              size="mini"
              :loading="placeSearching"
              @click="searchPlace"
              >搜索</el-button
            >
          </div>
          <el-select
            v-model="siteMapPick"
            filterable
            clearable
            size="mini"
            placeholder="输入站点名称定位"
            class="site-map-search"
            @change="locateSiteOnMap"
          >
            <el-option
              v-for="s in siteMapSites"
              :key="s.Id"
              :label="s.LocationName"
              :value="s.Id"
            />
          </el-select>
          <div class="site-map-wrap">
            <div v-if="placeResults.length" class="site-map-results">
              <div
                v-for="(p, i) in placeResults"
                :key="i"
                class="site-map-result"
                @click="selectPlaceResult(p)"
              >
                <div class="site-map-result__title">{{ p.title }}</div>
                <div class="site-map-result__addr">{{ p.address }}</div>
              </div>
            </div>
            <div ref="siteMapBox" class="site-map-box"></div>
            <div v-if="!siteMapReady" class="site-map-mask">
              {{ siteMapError || '地图加载中...' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 下单信息确认预览 ==================== -->
    <el-dialog
      title="确认订单信息"
      :visible.sync="confirmVisible"
      width="560px"
      :close-on-click-modal="false"
    >
      <div class="confirm-preview">
        <div class="cp-row">
          <span class="cp-label">路线</span>
          <span>{{ orderLine.LineName || '-' }}</span>
        </div>
        <div class="cp-row">
          <span class="cp-label">班次</span>
          <span
            >{{ today }} {{ (schedule.DepartureTime || '').slice(11, 16) }}</span
          >
        </div>
        <div class="cp-row">
          <span class="cp-label">上下车站</span>
          <span>{{ boardSiteName }} → {{ alightSiteName }}</span>
        </div>
        <div class="cp-row">
          <span class="cp-label">联系人电话</span>
          <span>{{ contactPhone }}</span>
        </div>
        <div class="cp-row" v-if="remark">
          <span class="cp-label">备注</span>
          <span>{{ remark }}</span>
        </div>
        <el-table
          :data="passengers"
          size="mini"
          border
          style="width: 100%; margin-top: 8px"
        >
          <el-table-column prop="Name" label="姓名" width="80" />
          <el-table-column prop="Phone" label="电话" width="110" />
          <el-table-column prop="IdCard" label="身份证" min-width="160" />
          <el-table-column label="类型" width="60" align="center">
            <template slot-scope="scope">{{
              scope.row.isChild ? '儿童' : '成人'
            }}</template>
          </el-table-column>
          <el-table-column label="票价" width="80" align="center">
            <template slot-scope="scope"
              >¥{{
                money(
                  scope.row.isChild
                    ? scheduleChildPrice
                    : scheduleAdultPrice,
                )
              }}</template
            >
          </el-table-column>
        </el-table>
        <div class="cp-total">
          合计：<span class="strong">¥ {{ money(orderTotal) }}</span>
          <span class="cp-tip"
            >（成人 ¥{{ money(scheduleAdultPrice) }} × {{ adultCount
            }}<template v-if="childCount">
              · 儿童 ¥{{ money(scheduleChildPrice) }} × {{ childCount }}
            </template>）</span
          >
        </div>
      </div>
      <div slot="footer">
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="doSubmitOrder"
          >确认下单</el-button
        >
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Message } from 'element-ui'
import request from '@/utils/request'
import loadBMapGL from '@/utils/bmap'
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
      confirmVisible: false, // 下单确认预览框
      // —— 右侧站点地图 ——
      siteMapSites: [], // 全部站点（/BusOrder/GetSearchBusLocation）
      siteMapPick: null, // 下拉选中的站点 Id
      siteMapReady: false,
      siteMapError: '',
      // 地图地点检索
      placeKeyword: '',
      placeResults: [],
      placeSearching: false,
    }
  },
  computed: {
    currentLine() {
      const list = Array.isArray(this.lines) ? this.lines : []
      return list.find((item) => item.Id === this.lineId) || {}
    },
    // 下单用的线路：优先取"路线"下拉选中的线路；没选线路时直接用班次自带的线路信息
    orderLine() {
      if (this.currentLine.Id) return this.currentLine
      if (this.schedule && this.schedule.LineId) {
        return {
          Id: this.schedule.LineId,
          LineName:
            this.schedule.LineId_Name ||
            this.schedule.LineName ||
            this.schedule.StartSiteName +
              (this.schedule.EndSiteName
                ? ' → ' + this.schedule.EndSiteName
                : ''),
        }
      }
      return {}
    },
    boardSiteName() {
      // 下拉的 value 是 LocationId，需按 LocationId 匹配
      const site = this.startSiteList.find(
        (s) => (s.LocationId || s.Id || s.SiteId) === this.boardSiteId,
      )
      return site ? site.LocationName || site.SiteName || site.Name : '-'
    },
    alightSiteName() {
      const site = this.endSiteList.find(
        (s) => (s.LocationId || s.Id || s.SiteId) === this.alightSiteId,
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
  mounted() {
    this.$nextTick(this.initSiteMap)
  },
  beforeDestroy() {
    clearTimeout(this.placeTimer)
    this.localSearch = null
    this.siteMap = null
    this.siteMarkers = []
    this.BMapGL = null
  },
  methods: {
    money(val) {
      const num = Number(val)
      return Number.isFinite(num) ? num.toFixed(2) : '0.00'
    },
    // ==================== 右侧站点地图 ====================
    async initSiteMap() {
      if (this.siteMap) return
      try {
        const BMapGL = await loadBMapGL()
        this.BMapGL = BMapGL
        if (!this.$refs.siteMapBox) return
        const map = new BMapGL.Map(this.$refs.siteMapBox, {
          minZoom: 5,
          maxZoom: 19,
        })
        map.centerAndZoom(new BMapGL.Point(112.562209, 37.79319), 12)
        map.enableScrollWheelZoom(true)
        map.addControl(new BMapGL.NavigationControl())
        map.addControl(new BMapGL.ScaleControl())
        this.siteMap = map
        this.siteMarkers = []
        this.siteMapReady = true
        // 地点检索：结果自己渲染成下拉面板，不用地图自带检索面板
        this.localSearch = new BMapGL.LocalSearch(map, {
          pageCapacity: 10,
          onSearchComplete: (results) =>
            this.handlePlaceSearchComplete(results),
        })
        await this.loadSiteMapSites()
      } catch (e) {
        this.siteMapError = e.message || '地图加载失败'
      }
    },
    // 全部站点：POST /BusOrder/GetSearchBusLocation
    async loadSiteMapSites() {
      try {
        const res = await request({
          url: '/BusOrder/GetSearchBusLocation',
          method: 'post',
          data: {},
          noDuplicate: true,
        })
        this.siteMapSites = toArray(res.data).filter(
          (s) => s && Number(s.Longitude) && Number(s.Latitude),
        )
      } catch (e) {
        this.siteMapSites = []
      }
      this.drawSiteMapMarkers()
    },
    // 标注全部站点
    drawSiteMapMarkers() {
      const BMapGL = this.BMapGL
      const map = this.siteMap
      if (!map || !BMapGL) return
      map.clearOverlays()
      this.siteMarkers = []
      this.siteMapSites.forEach((s) => {
        const point = new BMapGL.Point(
          Number(s.Longitude),
          Number(s.Latitude),
        )
        const marker = new BMapGL.Marker(point)
        marker.addEventListener('click', () => this.openSiteInfo(s, point))
        this.siteMarkers.push(marker)
        map.addOverlay(marker)
      })
      if (this.siteMarkers.length > 1) {
        map.setViewport(this.siteMarkers.map((m) => m.getPosition()))
      }
    },
    // 站点气泡
    openSiteInfo(site, point) {
      const BMapGL = this.BMapGL
      if (!BMapGL || !this.siteMap) return
      const info = new BMapGL.InfoWindow(
        '<div style="padding:6px 8px;font-size:13px;line-height:1.6;">' +
          '<div style="font-weight:700;">' +
          (site.LocationName || '') +
          '</div>' +
          (site.DetailAddress
            ? '<div style="color:#909399;font-size:12px;">' +
              site.DetailAddress +
              '</div>'
            : '') +
          '</div>',
      )
      this.siteMap.openInfoWindow(info, point)
      this.siteMap.centerAndZoom(point, 16)
    },
    // 下拉按名称定位站点
    locateSiteOnMap(id) {
      if (id == null || id === '') {
        if (this.siteMarkers && this.siteMarkers.length > 1) {
          this.siteMap.setViewport(this.siteMarkers.map((m) => m.getPosition()))
        }
        return
      }
      const site = this.siteMapSites.find((s) => s.Id === id)
      if (!site || !this.BMapGL || !this.siteMap) return
      this.openSiteInfo(
        site,
        new this.BMapGL.Point(Number(site.Longitude), Number(site.Latitude)),
      )
    },
    // ==================== 地图地点检索 ====================
    searchPlace() {
      const keyword = (this.placeKeyword || '').trim()
      if (!keyword) {
        Message.warning('请输入要搜索的地点')
        return
      }
      if (!this.localSearch) {
        Message.warning('地图还没准备好，请稍候再试')
        return
      }
      this.placeSearching = true
      this.placeResults = []
      clearTimeout(this.placeTimer)
      // 兜底：个别关键词不回调时 10 秒解除 loading
      this.placeTimer = setTimeout(() => {
        this.placeSearching = false
      }, 10000)
      this.localSearch.search(keyword)
    },
    handlePlaceSearchComplete(results) {
      clearTimeout(this.placeTimer)
      this.placeSearching = false
      // 多关键词时返回数组，只取第一组
      const result = Array.isArray(results) ? results[0] : results
      if (!result || !result.getCurrentNumPois) {
        this.placeResults = []
        return
      }
      const total = result.getCurrentNumPois()
      if (!total) {
        this.placeResults = []
        Message.warning('没有找到相关地点，换个关键词试试')
        return
      }
      const list = []
      for (let i = 0; i < total; i++) {
        const poi = result.getPoi(i)
        if (!poi || !poi.point) continue
        list.push({
          title: poi.title || poi.address || '未命名地点',
          address: poi.address || '',
          longitude: poi.point.lng,
          latitude: poi.point.lat,
        })
      }
      this.placeResults = list
    },
    // 点击检索结果：地图跳过去并弹出气泡
    selectPlaceResult(item) {
      this.placeResults = []
      this.placeKeyword = item.title
      if (!this.siteMap || !this.BMapGL) return
      const point = new this.BMapGL.Point(item.longitude, item.latitude)
      this.siteMap.centerAndZoom(point, 17)
      const info = new this.BMapGL.InfoWindow(
        '<div style="padding:6px 8px;font-size:13px;line-height:1.6;">' +
          '<div style="font-weight:700;">' +
          item.title +
          '</div>' +
          (item.address
            ? '<div style="color:#909399;font-size:12px;">' +
              item.address +
              '</div>'
            : '') +
          '</div>',
      )
      this.siteMap.openInfoWindow(info, point)
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
      this.searchSchedules()
    },
    // 路线切换/清空：清掉已选班次和上下车站，再重查班次
    onLineChange() {
      this.schedule = {}
      this.boardSiteId = null
      this.alightSiteId = null
      this.startSiteList = []
      this.endSiteList = []
      this.searchSchedules()
    },
    // 路线运营时刻：POST /BusOrder/GetBusIndexLineList
    // 参数：citys=路线(城市对) today=日期 SearchSiteId=热门站点(逗号串) BusLineId=线路Id
    // 返回：data.Bus_ShiftList 为班次列表
    async searchSchedules() {
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
      await this.fetchSiteList(item.LineId)
    },
    // 调用接口获取路线站点信息
    async fetchSiteList(lineId) {
      this.siteLoading = true
      try {
        const res = await request({
          url: '/api/BusMobile/GetBusLineSiteTimeInfo',
          method: 'post',
          data: {
            ScheduleId: this.schedule.Id,
            LineId: String(lineId),
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
      const line = this.orderLine
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
    // 提交订单：先校验，通过后弹出确认预览框
    submitOrder() {
      if (!this.validate()) return
      this.confirmVisible = true
    },
    // 预览框点"确认下单"后真正提交
    async doSubmitOrder() {
      const line = this.orderLine
      const personalIds = this.passengers
        .map(
          (p) =>
            `${String(p.Name).trim()}|${String(p.Phone).trim()}|${String(
              p.IdCard || '',
            ).trim()}|${p.isChild ? 1 : 0}`,
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
        this.confirmVisible = false
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

  /* 两列布局：左侧下单流程，右侧常驻站点地图 */
  .flow-layout {
    display: flex;
    align-items: flex-start;
  }
  .flow-main {
    flex: 1;
    min-width: 0;
  }
  .flow-map {
    flex: 0 0 50%;
    width: 50%;
    max-width: 900px;
    margin-left: 12px;
    position: sticky;
    top: 12px;

    .site-map-panel {
      display: flex;
      flex-direction: column;
      margin-bottom: 0;
    }
    .site-map-search {
      width: 100%;
      margin-bottom: 8px;
    }
    .site-map-tools {
      display: flex;
      margin-bottom: 8px;

      .el-input {
        flex: 1;
      }
      .el-button {
        margin-left: 8px;
        flex: 0 0 auto;
      }
    }
  }
  /* 地点检索结果下拉（覆盖在地图上方） */
  .site-map-results {
    position: absolute;
    top: 8px;
    right: 8px;
    left: 8px;
    z-index: 30;
    max-height: 260px;
    overflow-y: auto;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  }
  .site-map-result {
    padding: 8px 10px;
    border-bottom: 1px solid #f2f6fc;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }
    &:hover {
      background: #f5f7fa;
    }

    &__title {
      font-size: 13px;
      line-height: 1.5;
      color: #303133;
    }
    &__addr {
      font-size: 12px;
      line-height: 1.5;
      color: #909399;
    }
  }
  .site-map-wrap {
    position: relative;
    height: calc(100vh - 220px);
    min-height: 480px;
  }
  .site-map-box {
    width: 100%;
    height: 100%;
    border: 1px solid #ebeef5;
    border-radius: $radius;
    overflow: hidden;
  }
  .site-map-mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    border-radius: $radius;
    font-size: 13px;
    color: #909399;
  }
  @media (max-width: 1200px) {
    .flow-layout {
      flex-direction: column;
    }
    .flow-map {
      flex: none;
      width: 100%;
      margin: 0 0 12px;
      position: static;

      .site-map-wrap {
        height: 420px;
        min-height: 420px;
      }
    }
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

  // 下单确认预览框
  .confirm-preview {
    .cp-row {
      display: flex;
      margin-bottom: 6px;
      font-size: 13px;
      color: #606266;
    }
    .cp-label {
      width: 80px;
      flex-shrink: 0;
      color: #909399;
    }
    .cp-total {
      margin-top: 10px;
      font-size: 14px;
      color: #606266;

      .strong {
        font-size: 18px;
        font-weight: 600;
        color: $danger;
      }
      .cp-tip {
        margin-left: 6px;
        font-size: 12px;
        color: #909399;
      }
    }
  }
}
</style>
