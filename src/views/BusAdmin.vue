<template>
  <div class="bus-admin">
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <!-- ==================== 站点管理 ==================== -->
      <el-tab-pane label="站点管理" name="site">
        <el-row :gutter="12">
          <el-col :xs="24" :md="14">
            <div class="panel">
              <div class="panel__head">
                <span class="panel__title">地图选点</span>
                <span class="panel__tip"
                  >点击地图选择站点位置，自动回填经纬度与地址</span
                >
              </div>
              <div class="map-wrap">
                <div v-show="mapReady" class="map-search">
                  <el-input
                    v-model="searchKeyword"
                    size="mini"
                    placeholder="搜索地址 / 地点，回车检索"
                    clearable
                    @keyup.enter.native="searchAddress"
                    @clear="clearSearch"
                  />
                  <el-button
                    type="primary"
                    size="mini"
                    :loading="searching"
                    @click="searchAddress"
                    >搜索</el-button
                  >
                </div>
                <div
                  v-if="mapReady && searchResults.length"
                  class="search-panel"
                >
                  <div
                    v-for="(item, index) in searchResults"
                    :key="index"
                    class="search-item"
                    @click="selectSearchResult(item)"
                  >
                    <div class="search-item__title">{{ item.title }}</div>
                    <div class="search-item__address">{{ item.address }}</div>
                  </div>
                </div>
                <div ref="mapBox" class="map-box"></div>
                <div v-if="!mapReady" class="map-mask">
                  <span>{{ mapError || '地图加载中...' }}</span>
                  <el-button
                    v-if="mapError"
                    type="text"
                    size="mini"
                    @click="retryMap"
                    >重试</el-button
                  >
                </div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :md="10">
            <div class="panel">
              <div class="panel__head">
                <span class="panel__title">{{
                  siteForm.Id ? '编辑站点 #' + siteForm.Id : '新增站点'
                }}</span>
                <span class="panel__tip">带 * 为必填</span>
              </div>
              <el-form
                ref="siteForm"
                :model="siteForm"
                :rules="siteRules"
                label-width="86px"
                size="mini"
              >
                <el-form-item label="站点名称" prop="LocationName">
                  <el-input
                    v-model="siteForm.LocationName"
                    placeholder="如：太原南站"
                    clearable
                  />
                </el-form-item>
                <el-form-item label="详细地址">
                  <el-input
                    v-model="siteForm.DetailAddress"
                    type="textarea"
                    :rows="2"
                    placeholder="点击地图后自动填充，可手动修改"
                  />
                </el-form-item>
                <el-form-item label="经度">
                  <el-input-number
                    v-model="siteForm.Longitude"
                    :precision="6"
                    :step="0.0001"
                    :controls="false"
                    placeholder="112.617734"
                    class="full"
                  />
                </el-form-item>
                <el-form-item label="纬度">
                  <el-input-number
                    v-model="siteForm.Latitude"
                    :precision="6"
                    :step="0.0001"
                    :controls="false"
                    placeholder="37.757249"
                    class="full"
                  />
                </el-form-item>
                <el-form-item label="省 / 市">
                  <div class="two-col">
                    <el-input v-model="siteForm.Province" placeholder="省" />
                    <el-input v-model="siteForm.City" placeholder="市" />
                  </div>
                </el-form-item>
                <el-form-item label="区县">
                  <el-input v-model="siteForm.County" placeholder="区 / 县" />
                </el-form-item>
                <el-form-item label="所属组织">
                  <el-input
                    v-model="siteForm.OrganizationId"
                    placeholder="OrganizationId"
                  />
                </el-form-item>
                <el-form-item label="状态">
                  <el-switch
                    v-model="siteForm.Status"
                    active-text="启用"
                    inactive-text="禁用"
                  />
                </el-form-item>
                <el-form-item class="form-actions">
                  <el-button
                    type="primary"
                    :loading="siteSaving"
                    @click="saveSite"
                    >保存</el-button
                  >
                  <el-button @click="resetSiteForm">清空</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
        </el-row>

        <div class="panel">
          <div class="panel__head">
            <span class="panel__title">站点列表（共 {{ siteTotal }} 个）</span>
            <el-button type="text" size="mini" @click="loadSites()"
              >刷新</el-button
            >
          </div>
          <el-table
            v-loading="siteLoading"
            :data="siteList"
            border
            size="mini"
            style="width: 100%"
          >
            <el-table-column
              prop="LocationName"
              label="站点名称"
              min-width="120"
            />
            <el-table-column
              prop="DetailAddress"
              label="详细地址"
              min-width="220"
              show-overflow-tooltip
            />
            <el-table-column
              prop="Status_Name"
              label="状态"
              width="80"
              align="center"
            >
              <template slot-scope="scope">
                <el-tag
                  size="mini"
                  :type="scope.row.Status ? 'success' : 'info'"
                >
                  {{ scope.row.Status_Name }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="CreateTime"
              label="创建时间"
              width="150"
              align="center"
            />
            <el-table-column label="操作" width="130" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="mini" @click="editSite(scope.row)"
                  >编辑</el-button
                >
                <el-button
                  type="text"
                  size="mini"
                  @click="locateSite(scope.row)"
                  >地图定位</el-button
                >
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            :current-page="sitePage.pageIndex"
            :page-size="sitePage.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="siteTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSiteSizeChange"
            @current-change="handleSitePageChange"
          >
          </el-pagination>
        </div>
      </el-tab-pane>

      <!-- ==================== 线路管理 ==================== -->
      <el-tab-pane label="线路管理" name="line">
        <div class="panel">
          <div class="panel__head">
            <span class="panel__title">巴士线路（共 {{ lineTotal }} 条）</span>
            <div class="panel__tools">
              <el-button type="primary" size="mini" @click="openLineDialog()"
                >新建线路</el-button
              >
              <el-button size="mini" @click="loadLines()">刷新</el-button>
            </div>
          </div>
          <el-table
            v-loading="lineLoading"
            :data="lineList"
            border
            size="mini"
            style="width: 100%"
          >
            <el-table-column prop="LineName" label="线路名称" min-width="130" />
            <el-table-column
              prop="StatingLocation_Name"
              label="起点站"
              min-width="110"
            />
            <el-table-column
              prop="EndLocation_Name"
              label="终点站"
              min-width="110"
            />
            <el-table-column
              prop="JourneyTime"
              label="行程(分)"
              width="90"
              align="center"
            />
            <el-table-column
              prop="JourneyPrice"
              label="票价(元)"
              width="90"
              align="center"
            />
            <el-table-column
              prop="Mileage"
              label="里程(km)"
              width="90"
              align="center"
            />
            <el-table-column label="操作" width="160" align="center">
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="mini"
                  @click="openLineSites(scope.row)"
                  >站点编排</el-button
                >
                <el-button
                  type="text"
                  size="mini"
                  @click="openLineDialog(scope.row)"
                  >编辑</el-button
                >
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            :current-page="linePage.pageIndex"
            :page-size="linePage.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="lineTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="handleLineSizeChange"
            @current-change="handleLinePageChange"
          >
          </el-pagination>
        </div>
      </el-tab-pane>

      <!-- ==================== 班车模板 ==================== -->
      <el-tab-pane label="班车模板" name="tpl">
        <div class="panel">
          <div class="panel__head">
            <span class="panel__title">运营线路时刻模板</span>
            <div class="panel__tools">
              <el-select
                v-model="tplLineId"
                size="mini"
                clearable
                filterable
                placeholder="全部线路"
                class="line-filter"
              >
                <el-option
                  v-for="item in allLines"
                  :key="item.Id"
                  :label="item.LineName"
                  :value="item.Id"
                />
              </el-select>
              <el-button size="mini" @click="loadTemplates()">刷新</el-button>
            </div>
          </div>
          <el-alert
            type="info"
            :closable="false"
            show-icon
            title="一个模板包含多条线路，每条线路可排多趟班车（每趟班车绑定车辆与司机）。司机管理、时刻表管理的新增/修改接口后端暂未提供，本页先做展示。"
          />
          <el-table
            v-loading="tplLoading"
            :data="pagedTemplates"
            border
            size="mini"
            style="width: 100%"
          >
            <el-table-column prop="LineId_Name" label="线路" min-width="120" />
            <el-table-column label="班车时间" min-width="130" align="center">
              <template slot-scope="scope">
                {{ scope.row.StartTime }} ~ {{ scope.row.EndTime }}
              </template>
            </el-table-column>
            <el-table-column
              prop="VehicleId_Name"
              label="车辆"
              min-width="100"
              align="center"
            />
            <el-table-column label="司机" min-width="140" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.DriverId_Name || '-' }}</span>
                <span v-if="scope.row.DriverId_Phone" class="sub">
                  {{ scope.row.DriverId_Phone }}
                </span>
              </template>
            </el-table-column>
            <el-table-column
              prop="JourneyPrice"
              label="票价(元)"
              width="90"
              align="center"
            />
            <el-table-column
              prop="SitePrice"
              label="站点价(元)"
              width="100"
              align="center"
            />
            <el-table-column
              prop="IsOpen_Name"
              label="状态"
              width="80"
              align="center"
            >
              <template slot-scope="scope">
                <el-tag
                  size="mini"
                  :type="scope.row.IsOpen ? 'success' : 'info'"
                >
                  {{ scope.row.IsOpen_Name }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            :current-page="tplPage.pageIndex"
            :page-size="tplPage.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="filteredTemplates.length"
            layout="total, sizes, prev, pager, next"
            @size-change="handleTplSizeChange"
            @current-change="handleTplPageChange"
          >
          </el-pagination>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新建 / 编辑线路 -->
    <el-dialog
      :title="lineForm.Id ? '编辑线路 #' + lineForm.Id : '新建线路'"
      :visible.sync="lineDialogVisible"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="lineForm"
        :model="lineForm"
        :rules="lineRules"
        label-width="96px"
        size="mini"
      >
        <el-form-item label="线路名称" prop="LineName">
          <el-input v-model="lineForm.LineName" placeholder="如：太原-文水" />
        </el-form-item>
        <el-row :gutter="8">
          <el-col :span="12">
            <el-form-item label="起点站" prop="StatingLocation">
              <el-select
                v-model="lineForm.StatingLocation"
                filterable
                placeholder="选择站点"
                class="full"
              >
                <el-option
                  v-for="item in allSites"
                  :key="item.Id"
                  :label="item.LocationName"
                  :value="item.Id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="终点站" prop="EndLocation">
              <el-select
                v-model="lineForm.EndLocation"
                filterable
                placeholder="选择站点"
                class="full"
              >
                <el-option
                  v-for="item in allSites"
                  :key="item.Id"
                  :label="item.LocationName"
                  :value="item.Id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="途经点">
          <el-select
            v-model="lineForm.WaypointIds"
            multiple
            filterable
            placeholder="可多选，按选择顺序加入线路"
            class="full"
          >
            <el-option
              v-for="item in waypointOptions"
              :key="item.Id"
              :label="item.LocationName"
              :value="item.Id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="lineForm.WaypointIds.length" label="途经顺序">
          <div class="waypoints">
            <div
              v-for="(id, index) in lineForm.WaypointIds"
              :key="id"
              class="waypoint"
            >
              <span class="waypoint__index">{{ index + 1 }}</span>
              <span class="waypoint__name">{{ siteName(id) }}</span>
              <el-button
                type="text"
                size="mini"
                :disabled="index === 0"
                @click="moveWaypoint(index, -1)"
                >上移</el-button
              >
              <el-button
                type="text"
                size="mini"
                :disabled="index === lineForm.WaypointIds.length - 1"
                @click="moveWaypoint(index, 1)"
                >下移</el-button
              >
            </div>
          </div>
        </el-form-item>
        <el-row :gutter="8">
          <el-col :span="8">
            <el-form-item label="行程(分)">
              <el-input-number
                v-model="lineForm.JourneyTime"
                :min="0"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="票价(元)">
              <el-input-number
                v-model="lineForm.JourneyPrice"
                :min="0"
                :precision="2"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="里程(km)">
              <el-input-number
                v-model="lineForm.Mileage"
                :min="0"
                :precision="1"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="所属组织">
          <el-input v-model="lineForm.OrganizationId" />
        </el-form-item>
        <el-alert
          type="warning"
          :closable="false"
          title="起点/终点会随线路一起保存；途经点顺序目前只在页面内编排，落库需要后端提供线路站点接口（如 /BusOrder/CreateBusLineSite），已存在的站点可在「站点编排」里调整类型和顺序。"
        />
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="lineDialogVisible = false"
          >取消</el-button
        >
        <el-button
          type="primary"
          size="small"
          :loading="lineSaving"
          @click="saveLine"
          >保存</el-button
        >
      </span>
    </el-dialog>

    <!-- 线路站点编排 -->
    <el-dialog
      :title="currentLine ? currentLine.LineName + ' - 站点编排' : '站点编排'"
      :visible.sync="lineSiteVisible"
      width="860px"
      :close-on-click-modal="false"
    >
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="出发地站点为上车点、目的地站点为下车点，序号即行驶顺序。可修改已有站点的类型与顺序；新增站点需要后端提供创建接口。"
      />
      <el-row :gutter="12" class="site-groups">
        <el-col :span="12">
          <div class="group-title">
            上车点（出发地站点 {{ lineSiteUp.length }}）
          </div>
          <el-table
            :data="lineSiteUp"
            border
            size="mini"
            v-loading="lineSiteLoading"
          >
            <el-table-column
              prop="Sort"
              label="序号"
              width="60"
              align="center"
            />
            <el-table-column prop="LocationName" label="站点" min-width="110" />
            <el-table-column label="操作" width="70" align="center">
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="mini"
                  @click="openLineSiteEdit(scope.row)"
                  >编辑</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-col>
        <el-col :span="12">
          <div class="group-title">
            下车点（目的地站点 {{ lineSiteDown.length }}）
          </div>
          <el-table
            :data="lineSiteDown"
            border
            size="mini"
            v-loading="lineSiteLoading"
          >
            <el-table-column
              prop="Sort"
              label="序号"
              width="60"
              align="center"
            />
            <el-table-column prop="LocationName" label="站点" min-width="110" />
            <el-table-column label="操作" width="70" align="center">
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="mini"
                  @click="openLineSiteEdit(scope.row)"
                  >编辑</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
      <span slot="footer">
        <el-button size="small" @click="lineSiteVisible = false"
          >关闭</el-button
        >
      </span>
    </el-dialog>

    <!-- 编辑单个线路站点 -->
    <el-dialog
      title="编辑线路站点"
      :visible.sync="lineSiteEditVisible"
      width="420px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form :model="lineSiteForm" label-width="86px" size="mini">
        <el-form-item label="站点">
          <el-input :value="lineSiteForm.LocationName" disabled />
        </el-form-item>
        <el-form-item label="站点类型">
          <el-select v-model="lineSiteForm.SType" class="full">
            <el-option label="出发地站点" :value="1" />
            <el-option label="目的地站点" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="lineSiteForm.Sort"
            :min="1"
            :controls="false"
            class="full"
          />
        </el-form-item>
        <el-form-item label="到达分钟">
          <el-input-number
            v-model="lineSiteForm.ArrivalMinute"
            :min="0"
            :controls="false"
            class="full"
          />
        </el-form-item>
        <el-form-item label="所属组织">
          <el-input v-model="lineSiteForm.OrganizationId" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="lineSiteEditVisible = false"
          >取消</el-button
        >
        <el-button
          type="primary"
          size="small"
          :loading="lineSiteSaving"
          @click="saveLineSite"
          >保存</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { Message } from 'element-ui'
import request from '@/utils/request'
import loadBMapGL from '@/utils/bmap'

// 默认组织：与后台「巴士订单」现有数据一致（山西畅亿科技有限公司）
const DEFAULT_ORG = '200004-49a09eab654f4064ae2031ee76bffd90'

const emptySite = () => ({
  Id: null,
  LocationName: '',
  Longitude: null,
  Latitude: null,
  DetailAddress: '',
  Province: '',
  City: '',
  County: '',
  OrganizationId: DEFAULT_ORG,
  Status: true,
})

const emptyLine = () => ({
  Id: null,
  LineName: '',
  ParentId: 0,
  OrganizationId: DEFAULT_ORG,
  StatingLocation: null,
  EndLocation: null,
  JourneyTime: 0,
  JourneyPrice: 0,
  Mileage: 0,
  WaypointIds: [],
})

export default {
  name: 'BusAdmin',
  data() {
    return {
      activeTab: 'site',
      // —— 地图 ——
      mapReady: false,
      mapError: '',
      searchKeyword: '',
      searching: false,
      searchResults: [],
      // —— 站点 ——
      siteForm: emptySite(),
      siteSaving: false,
      siteLoading: false,
      siteList: [],
      siteTotal: 0,
      sitePage: { pageIndex: 1, pageSize: 10 },
      allSites: [],
      siteRules: {
        LocationName: [
          { required: true, message: '请输入站点名称', trigger: 'blur' },
        ],
      },
      // —— 线路 ——
      lineList: [],
      lineTotal: 0,
      lineLoading: false,
      linePage: { pageIndex: 1, pageSize: 10 },
      allLines: [],
      lineDialogVisible: false,
      lineSaving: false,
      lineForm: emptyLine(),
      lineRules: {
        LineName: [
          { required: true, message: '请输入线路名称', trigger: 'blur' },
        ],
        StatingLocation: [
          { required: true, message: '请选择起点站', trigger: 'change' },
        ],
        EndLocation: [
          { required: true, message: '请选择终点站', trigger: 'change' },
        ],
      },
      // —— 线路站点 ——
      lineSiteVisible: false,
      lineSiteLoading: false,
      lineSiteList: [],
      currentLine: null,
      lineSiteEditVisible: false,
      lineSiteSaving: false,
      lineSiteForm: {
        Id: null,
        LineId: null,
        LocationId: null,
        LocationName: '',
        SType: 1,
        Sort: 1,
        ArrivalMinute: 0,
        OrganizationId: DEFAULT_ORG,
      },
      // —— 班车模板 ——
      tplList: [],
      tplLoading: false,
      tplLineId: null,
      tplPage: { pageIndex: 1, pageSize: 10 },
    }
  },
  computed: {
    // 途经点候选：排除已选的起点/终点
    waypointOptions() {
      const { StatingLocation, EndLocation } = this.lineForm
      return this.allSites.filter(
        (item) => item.Id !== StatingLocation && item.Id !== EndLocation,
      )
    },
    lineSiteUp() {
      return this.lineSiteList.filter((item) => item.SType === 1)
    },
    lineSiteDown() {
      return this.lineSiteList.filter((item) => item.SType === 2)
    },
    // 后端未严格按 LineId 过滤模板，这里再兜一层
    filteredTemplates() {
      if (!this.tplLineId) return this.tplList
      return this.tplList.filter((item) => item.LineId === this.tplLineId)
    },
    pagedTemplates() {
      const start = (this.tplPage.pageIndex - 1) * this.tplPage.pageSize
      return this.filteredTemplates.slice(start, start + this.tplPage.pageSize)
    },
  },
  created() {
    // 地图实例、BMapGL 命名空间不放进 data：避免被 Vue 做成响应式
    this.map = null
    this.mapLoading = false
    this.geocoder = null
    this.BMapGL = null
    this.localSearch = null
    this.searchTimer = null
  },
  mounted() {
    this.initMap()
    this.loadSites()
    this.loadAllSites()
    this.loadLines()
    this.loadTemplates()
  },
  activated() {
    if (this.activeTab === 'site') this.$nextTick(this.resizeMap)
  },
  beforeDestroy() {
    clearTimeout(this.searchTimer)
    this.map = null
    this.geocoder = null
    this.localSearch = null
  },
  methods: {
    // ==================== 地图 ====================
    async initMap() {
      if (this.map || this.mapLoading) return
      this.mapLoading = true
      try {
        const BMapGL = await loadBMapGL()
        this.BMapGL = BMapGL
        if (!this.$refs.mapBox) return
        const map = new BMapGL.Map(this.$refs.mapBox, {
          minZoom: 5,
          maxZoom: 19,
        })
        map.centerAndZoom(new BMapGL.Point(112.562209, 37.79319), 12)
        map.enableScrollWheelZoom(true)
        map.addControl(new BMapGL.NavigationControl())
        map.addEventListener('click', (e) => this.handleMapClick(e.latlng))
        this.map = map
        this.geocoder = new BMapGL.Geocoder()
        // 地点检索：结果自己渲染成下拉面板，不用地图自带的检索面板
        this.localSearch = new BMapGL.LocalSearch(map, {
          pageCapacity: 10,
          onSearchComplete: (results) => this.handleSearchComplete(results),
        })
        this.mapReady = true
      } catch (e) {
        this.mapError = e.message || '地图加载失败'
      } finally {
        this.mapLoading = false
      }
    },
    // 地图加载失败后重试
    retryMap() {
      this.mapError = ''
      this.initMap()
    },
    resizeMap() {
      if (this.map && this.map.resize) this.map.resize()
    },
    // 地图选点：回填经纬度 + 反查地址
    handleMapClick(point) {
      if (!point) return
      this.searchResults = []
      this.siteForm.Longitude = Number(point.lng.toFixed(6))
      this.siteForm.Latitude = Number(point.lat.toFixed(6))
      this.drawMarker(point.lng, point.lat)
      if (!this.geocoder) return
      this.geocoder.getLocation(point, (rs) => {
        if (!rs) return
        const area = rs.addressComponents || {}
        if (area.province) this.siteForm.Province = area.province
        if (area.city) this.siteForm.City = area.city
        if (area.district) this.siteForm.County = area.district
        if (rs.address) {
          const poi = rs.content && rs.content.poi_desc
          this.siteForm.DetailAddress = poi
            ? rs.address + ',' + poi
            : rs.address
        }
      })
    },
    drawMarker(lng, lat) {
      if (!this.map || !this.BMapGL) return
      this.map.clearOverlays()
      this.map.addOverlay(
        new this.BMapGL.Marker(new this.BMapGL.Point(lng, lat)),
      )
    },
    focusMap(lng, lat, zoom) {
      if (!this.map || !this.BMapGL || lng == null || lat == null) return
      this.map.centerAndZoom(new this.BMapGL.Point(lng, lat), zoom || 15)
      this.drawMarker(lng, lat)
    },

    // ==================== 地图搜索 ====================
    searchAddress() {
      const keyword = (this.searchKeyword || '').trim()
      if (!keyword) {
        Message.warning('请输入要搜索的地址')
        return
      }
      if (!this.localSearch) {
        Message.warning('地图还没准备好，请稍候再试')
        return
      }
      this.searching = true
      this.searchResults = []
      clearTimeout(this.searchTimer)
      // 兜底：个别关键词检索不会回调，10 秒后解除 loading
      this.searchTimer = setTimeout(() => {
        this.searching = false
      }, 10000)
      this.localSearch.search(keyword)
    },
    handleSearchComplete(results) {
      clearTimeout(this.searchTimer)
      this.searching = false
      // 多关键词时 BMapGL 返回数组，这里只取第一组
      const result = Array.isArray(results) ? results[0] : results
      if (!result || !result.getCurrentNumPois) {
        this.searchResults = []
        return
      }
      const total = result.getCurrentNumPois()
      if (!total) {
        this.searchResults = []
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
          province: poi.province || '',
          city: poi.city || '',
          district: poi.district || '',
        })
      }
      this.searchResults = list
    },
    // 点击搜索结果：地图定位过去并回填表单
    selectSearchResult(item) {
      this.searchResults = []
      this.searchKeyword = item.title
      this.map.centerAndZoom(
        new this.BMapGL.Point(item.longitude, item.latitude),
        17,
      )
      this.drawMarker(item.longitude, item.latitude)
      this.siteForm.Longitude = Number(item.longitude.toFixed(6))
      this.siteForm.Latitude = Number(item.latitude.toFixed(6))
      if (!this.siteForm.LocationName) this.siteForm.LocationName = item.title
      if (item.address) this.siteForm.DetailAddress = item.address
      if (item.province) this.siteForm.Province = item.province
      if (item.city) this.siteForm.City = item.city
      if (item.district) this.siteForm.County = item.district
    },
    clearSearch() {
      this.searchResults = []
      this.searchKeyword = ''
    },
    handleTabClick(tab) {
      if (tab.name === 'site') this.$nextTick(this.resizeMap)
      if (tab.name === 'tpl') this.loadTemplates()
    },

    // ==================== 站点 ====================
    async loadSites() {
      this.siteLoading = true
      try {
        const res = await request({
          url: '/BusOrder/GetPageList',
          method: 'post',
          data: {
            pageIndex: this.sitePage.pageIndex,
            pageSize: this.sitePage.pageSize,
          },
        })
        this.siteList = res.data || []
        this.siteTotal = res.count || 0
      } catch (e) {
        this.siteList = []
        this.siteTotal = 0
      } finally {
        this.siteLoading = false
      }
    },
    // 全量站点：下拉选项、线路起终点、途经点共用
    async loadAllSites() {
      try {
        const res = await request({
          url: '/BusOrder/GetPageList',
          method: 'post',
          data: { pageIndex: 1, pageSize: 500 },
          noDuplicate: true,
        })
        this.allSites = res.data || []
      } catch (e) {
        this.allSites = []
      }
    },
    handleSiteSizeChange(size) {
      this.sitePage.pageSize = size
      this.sitePage.pageIndex = 1
      this.loadSites()
    },
    handleSitePageChange(page) {
      this.sitePage.pageIndex = page
      this.loadSites()
    },
    resetSiteForm() {
      this.siteForm = emptySite()
      if (this.$refs.siteForm) this.$refs.siteForm.clearValidate()
    },
    async editSite(row) {
      try {
        const res = await request({
          url: '/BusOrder/GetBusLocationInfo',
          method: 'get',
          params: { Id: row.Id },
        })
        const detail = res.data || {}
        this.siteForm = Object.assign(emptySite(), {
          Id: detail.Id,
          LocationName: detail.LocationName || '',
          Longitude: detail.Longitude != null ? Number(detail.Longitude) : null,
          Latitude: detail.Latitude != null ? Number(detail.Latitude) : null,
          DetailAddress: detail.DetailAddress || '',
          Province: detail.Province || '',
          City: detail.City || '',
          County: detail.County || '',
          OrganizationId: detail.OrganizationId || DEFAULT_ORG,
          Status: detail.Status !== false,
        })
        this.focusMap(this.siteForm.Longitude, this.siteForm.Latitude)
      } catch (e) {
        // 拦截器已提示
      }
    },
    async locateSite(row) {
      try {
        const res = await request({
          url: '/BusOrder/GetBusLocationInfo',
          method: 'get',
          params: { Id: row.Id },
        })
        const detail = res.data || {}
        this.focusMap(
          detail.Longitude != null ? Number(detail.Longitude) : null,
          detail.Latitude != null ? Number(detail.Latitude) : null,
        )
      } catch (e) {
        // 拦截器已提示
      }
    },
    saveSite() {
      this.$refs.siteForm.validate(async (valid) => {
        if (!valid) return
        if (this.siteForm.Longitude == null || this.siteForm.Latitude == null) {
          Message.warning('请先在地图上选择站点位置')
          return
        }
        this.siteSaving = true
        const payload = {
          LocationName: this.siteForm.LocationName,
          Longitude: this.siteForm.Longitude,
          Latitude: this.siteForm.Latitude,
          DetailAddress: this.siteForm.DetailAddress,
          OrganizationId: this.siteForm.OrganizationId,
          Province: this.siteForm.Province || null,
          City: this.siteForm.City || null,
          County: this.siteForm.County || null,
          Status: this.siteForm.Status,
        }
        try {
          if (this.siteForm.Id) {
            await request({
              url: '/BusOrder/UpdateBusLocation',
              method: 'post',
              data: Object.assign(payload, { Id: this.siteForm.Id }),
            })
          } else {
            await request({
              url: '/BusOrder/CreateBusLocation',
              method: 'post',
              data: payload,
            })
          }
          Message.success('保存成功')
          this.resetSiteForm()
          this.loadSites()
          this.loadAllSites()
        } catch (e) {
          // 拦截器已提示
        } finally {
          this.siteSaving = false
        }
      })
    },

    // ==================== 线路 ====================
    async loadLines() {
      this.lineLoading = true
      try {
        const res = await request({
          url: '/BusOrder/GetBusLinePageList',
          method: 'post',
          data: {
            pageIndex: this.linePage.pageIndex,
            pageSize: this.linePage.pageSize,
          },
        })
        this.lineList = res.data || []
        this.lineTotal = res.count || 0
      } catch (e) {
        this.lineList = []
        this.lineTotal = 0
      } finally {
        this.lineLoading = false
      }
    },
    async loadAllLines() {
      try {
        const res = await request({
          url: '/BusOrder/GetBusLinePageList',
          method: 'post',
          data: { pageIndex: 1, pageSize: 500 },
          noDuplicate: true,
        })
        this.allLines = res.data || []
      } catch (e) {
        this.allLines = []
      }
    },
    handleLineSizeChange(size) {
      this.linePage.pageSize = size
      this.linePage.pageIndex = 1
      this.loadLines()
    },
    handleLinePageChange(page) {
      this.linePage.pageIndex = page
      this.loadLines()
    },
    siteName(id) {
      const site = this.allSites.find((item) => item.Id === id)
      return site ? site.LocationName : id
    },
    moveWaypoint(index, offset) {
      const list = this.lineForm.WaypointIds.slice()
      const target = index + offset
      if (target < 0 || target >= list.length) return
      const tmp = list[index]
      list[index] = list[target]
      list[target] = tmp
      this.lineForm.WaypointIds = list
    },
    async openLineDialog(row) {
      if (!this.allLines.length) this.loadAllLines()
      if (!this.allSites.length) this.loadAllSites()
      if (row && row.Id) {
        try {
          const res = await request({
            url: '/BusOrder/GetBusLineInfo',
            method: 'get',
            params: { Id: row.Id },
          })
          const detail = res.data || {}
          this.lineForm = Object.assign(emptyLine(), {
            Id: detail.Id,
            LineName: detail.LineName || '',
            ParentId: detail.ParentId || 0,
            OrganizationId: detail.OrganizationId || DEFAULT_ORG,
            StatingLocation: detail.StatingLocation,
            EndLocation: detail.EndLocation,
            JourneyTime: detail.JourneyTime || 0,
            JourneyPrice: detail.JourneyPrice || 0,
            Mileage: detail.Mileage || 0,
          })
        } catch (e) {
          return
        }
      } else {
        this.lineForm = emptyLine()
      }
      this.lineDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.lineForm) this.$refs.lineForm.clearValidate()
      })
    },
    saveLine() {
      this.$refs.lineForm.validate(async (valid) => {
        if (!valid) return
        this.lineSaving = true
        const payload = {
          LineName: this.lineForm.LineName,
          ParentId: this.lineForm.ParentId || 0,
          OrganizationId: this.lineForm.OrganizationId,
          StatingLocation: this.lineForm.StatingLocation,
          EndLocation: this.lineForm.EndLocation,
          JourneyTime: this.lineForm.JourneyTime || 0,
          JourneyPrice: this.lineForm.JourneyPrice || 0,
          Mileage: this.lineForm.Mileage || 0,
        }
        try {
          if (this.lineForm.Id) {
            await request({
              url: '/BusOrder/UpdateBusLine',
              method: 'post',
              data: Object.assign(payload, { Id: this.lineForm.Id }),
            })
          } else {
            await request({
              url: '/BusOrder/CreateBusLine',
              method: 'post',
              data: payload,
            })
          }
          Message.success('保存成功')
          this.lineDialogVisible = false
          this.loadLines()
          this.loadAllLines()
        } catch (e) {
          // 拦截器已提示
        } finally {
          this.lineSaving = false
        }
      })
    },

    // ==================== 线路站点 ====================
    async openLineSites(line) {
      this.currentLine = line
      this.lineSiteVisible = true
      await this.loadLineSites()
    },
    async loadLineSites() {
      if (!this.currentLine) return
      this.lineSiteLoading = true
      try {
        const res = await request({
          url: '/BusOrder/GetBusLineSitePageList',
          method: 'post',
          data: {
            // LineId: this.currentLine.Id,
            pageIndex: 1,
            pageSize: 200,
          },
        })
        const list = res.data || []
        // 按序号排，序号相同按 Id 排，保证上下车两列顺序稳定
        this.lineSiteList = list.sort(
          (a, b) => (a.Sort || 0) - (b.Sort || 0) || a.Id - b.Id,
        )
      } catch (e) {
        this.lineSiteList = []
      } finally {
        this.lineSiteLoading = false
      }
    },
    openLineSiteEdit(row) {
      this.lineSiteForm = {
        Id: row.Id,
        LineId: row.LineId,
        LocationId: row.LocationId,
        LocationName: row.LocationName,
        SType: row.SType,
        Sort: row.Sort,
        ArrivalMinute: row.ArrivalMinute || 0,
        OrganizationId: row.OrganizationId || DEFAULT_ORG,
      }
      this.lineSiteEditVisible = true
    },
    async saveLineSite() {
      this.lineSiteSaving = true
      try {
        await request({
          url: '/BusOrder/UpdateBusLineSite',
          method: 'post',
          data: {
            Id: this.lineSiteForm.Id,
            LineId: this.lineSiteForm.LineId,
            LocationId: this.lineSiteForm.LocationId,
            Sort: this.lineSiteForm.Sort,
            SType: this.lineSiteForm.SType,
            OrganizationId: this.lineSiteForm.OrganizationId,
            ArrivalMinute: this.lineSiteForm.ArrivalMinute,
          },
        })
        Message.success('保存成功')
        this.lineSiteEditVisible = false
        this.loadLineSites()
      } catch (e) {
        // 拦截器已提示
      } finally {
        this.lineSiteSaving = false
      }
    },

    // ==================== 班车模板 ====================
    async loadTemplates() {
      if (!this.allLines.length) this.loadAllLines()
      this.tplLoading = true
      try {
        const data = { pageIndex: 1, pageSize: 200 }
        if (this.tplLineId) data.LineId = this.tplLineId
        const res = await request({
          url: '/BusOrder/GetBusLineTemplatePageList',
          method: 'post',
          data,
        })
        this.tplList = res.data || []
        this.tplPage.pageIndex = 1
      } catch (e) {
        this.tplList = []
      } finally {
        this.tplLoading = false
      }
    },
    handleTplSizeChange(size) {
      this.tplPage.pageSize = size
      this.tplPage.pageIndex = 1
    },
    handleTplPageChange(page) {
      this.tplPage.pageIndex = page
    },
  },
}
</script>

<style lang="scss" scoped>
.bus-admin {
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
    &__tools {
      display: flex;
      align-items: center;

      .el-button + .el-button {
        margin-left: 8px;
      }
    }
  }

  .map-wrap {
    position: relative;
  }
  .map-search {
    position: absolute;
    top: 10px;
    right: 10px;
    left: 10px;
    z-index: 30;
    display: flex;

    ::v-deep .el-input__inner {
      border-radius: 4px;
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15);
    }

    .el-input {
      flex: 1;
    }
    .el-button {
      margin-left: 8px;
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15);
    }
  }

  .search-panel {
    position: absolute;
    top: 44px;
    right: 10px;
    left: 10px;
    z-index: 30;
    max-height: 240px;
    overflow-y: auto;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  }

  .search-item {
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
    &__address {
      font-size: 12px;
      line-height: 1.5;
      color: #909399;
    }
  }

  .map-box {
    width: 100%;
    height: 420px;
    border: 1px solid #ebeef5;
    border-radius: $radius;
    overflow: hidden;
  }

  .map-mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
    border-radius: $radius;
    background: #fafafa;
    font-size: 13px;
    color: #909399;
    text-align: center;

    .el-button {
      margin-top: 4px;
    }
  }

  .two-col {
    display: flex;

    .el-input + .el-input {
      margin-left: 8px;
    }
  }

  .full {
    width: 100%;
  }

  .line-filter {
    width: 160px;
    margin-right: 8px;
  }

  .form-actions {
    margin-bottom: 0;
  }

  .site-groups {
    margin-top: 4px;
  }

  .group-title {
    margin-bottom: 8px;
    padding-left: 8px;
    border-left: 3px solid $primary;
    font-size: 13px;
    font-weight: 600;
    line-height: 14px;
    color: $header-bg;
  }

  .waypoints {
    width: 100%;
  }
  .waypoint {
    display: flex;
    align-items: center;
    padding: 2px 0;

    &__index {
      width: 20px;
      height: 20px;
      margin-right: 8px;
      border-radius: 50%;
      background: lighten($primary, 38%);
      color: darken($primary, 10%);
      font-size: 12px;
      line-height: 20px;
      text-align: center;
    }
    &__name {
      flex: 1;
      font-size: 13px;
      color: #606266;
    }
  }

  .sub {
    margin-left: 4px;
    font-size: 12px;
    color: #909399;
  }

  ::v-deep .el-pagination {
    margin-top: 10px;
    text-align: right;
  }
  ::v-deep .el-alert {
    margin-bottom: 10px;
  }
}
</style>
