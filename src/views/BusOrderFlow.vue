<template>
  <div class="bus-order">
    <!-- ==================== 线路 + 日期 ==================== -->
    <div class="panel">
      <div class="panel__head">
        <span class="panel__title">大巴线路</span>
        <span class="panel__tip">可选日期：今天起 3 天内</span>
      </div>
      <el-form :inline="true" size="small">
        <el-form-item label="线路">
          <el-select
            v-model="lineId"
            filterable
            clearable
            placeholder="选择线路"
            class="line-select"
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
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="scheduleLoading"
            @click="searchSchedules"
            >查询班次</el-button
          >
          <el-button @click="loadLines">刷新线路</el-button>
        </el-form-item>
      </el-form>
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
          {{ lineId ? '该线路当天暂无可售班次，换个日期或线路试试' : '请先在上方选择线路和日期，点击「查询班次」' }}
        </div>
        <div v-else class="schedule-list">
          <div
            v-for="item in schedules"
            :key="item.Id"
            class="schedule-card"
            :class="{ 'is-disabled': !canBuy(item), 'is-picked': schedule.Id === item.Id }"
          >
            <div class="schedule-card__time">
              {{ (item.DepartureTime || '').slice(11, 16) }}
            </div>
            <div class="schedule-card__route">
              {{ item.StatingLocation_Name || '-' }}
              <i class="el-icon-right"></i>
              {{ item.EndLocation_Name || '-' }}
            </div>
            <div class="schedule-card__meta">
              <span>余 {{ item.EmptySeat }} / {{ item.SeatTotal }} 座</span>
              <span class="price">¥ {{ money(item.TicketPrice) }}</span>
            </div>
            <div class="schedule-card__foot">
              <el-tag size="mini" type="info">{{
                item.IsStart_Name || '-'
              }}</el-tag>
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
                :key="item.Id"
                :label="item.LocationName"
                :value="item.Id"
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
                :key="item.Id"
                :label="item.LocationName"
                :value="item.Id"
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
          乘车人（{{ passengers.length }} 人，姓名/电话必填，身份证选填）
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
          <span class="price">¥ {{ money(schedule.TicketPrice) }}/人</span>
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
            placeholder="身份证号（选填）"
            class="pax-row__idcard"
          />
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
            >¥ {{ money(schedule.TicketPrice * passengers.length) }}</span
          >
          <span class="total" v-else>¥ 0.00</span>
          <span class="panel__tip" v-if="schedule.Id"
            >（{{ money(schedule.TicketPrice) }} ×
            {{ passengers.length }} 人）</span
          >
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

const pad = (n) => (n < 10 ? '0' + n : '' + n)
const formatDate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export default {
  name: 'BusOrderFlow',
  data() {
    return {
      lines: [],
      lineId: null,
      today: formatDate(new Date()),
      // 日期只允许 今天 ~ 今天+3 天
      datePickerOptions: {
        disabledDate(time) {
          const start = new Date()
          start.setHours(0, 0, 0, 0)
          const end = new Date()
          end.setDate(end.getDate() + 3)
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
      passengers: [{ Name: '', Phone: '', IdCard: '' }],
      contactPhone: '',
      remark: '',
      submitting: false,
    }
  },
  computed: {
    currentLine() {
      return this.lines.find((item) => item.Id === this.lineId) || {}
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
  },
  created() {
    this.loadLines()
  },
  methods: {
    money(val) {
      const num = Number(val)
      return Number.isFinite(num) ? num.toFixed(2) : '0.00'
    },
    canBuy(item) {
      return item && Number(item.EmptySeat) > 0
    },
    // 大巴线路
    async loadLines() {
      try {
        const res = await request({
          url: '/BusOrder/GetBusLineList',
          method: 'get',
        })
        this.lines = res.data || []
      } catch (e) {
        this.lines = []
      }
    },
    // 线路运营时刻
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
          url: '/BusOrder/GetBusLineScheduleList',
          method: 'get',
          params: { lineId: this.lineId, today: this.today },
        })
        this.schedules = res.data || []
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
    // 调用接口获取线路站点信息
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
        this.startSiteList = res.data.StartSiteList || []
        this.endSiteList = res.data.EndSiteList || []
      } catch (e) {
        this.startSiteList = []
        this.endSiteList = []
      } finally {
        this.siteLoading = false
      }
    },
    addPassenger() {
      this.passengers.push({ Name: '', Phone: '', IdCard: '' })
    },
    removePassenger(index) {
      if (this.passengers.length === 1) return
      this.passengers.splice(index, 1)
    },
    validate() {
      const line = this.currentLine
      if (!line.Id) {
        Message.warning('请选择线路')
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
      this.passengers = [{ Name: '', Phone: '', IdCard: '' }]
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
    &__idcard {
      width: 240px;
      margin-right: 8px;
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
