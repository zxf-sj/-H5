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
              label="全程(分钟)"
              width="90"
              align="center"
            />
            <el-table-column
              prop="JourneyPrice"
              label="优惠票价(元)"
              width="90"
              align="center"
            />
            <el-table-column
              prop="SitePrice"
              label="原票价(元)"
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
                  v-for="item in tplLines"
                  :key="item.Id"
                  :label="item.LineName"
                  :value="item.Id"
                />
              </el-select>
              <el-button type="primary" size="mini" @click="openTplDialog()"
                >新建模板</el-button
              >
              <el-button size="mini" @click="loadTemplates()">刷新</el-button>
            </div>
          </div>

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
              label="优惠票价(元)"
              width="90"
              align="center"
            />
            <el-table-column
              prop="SitePrice"
              label="原票价(元)"
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
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="mini"
                  @click="openTplDialog(scope.row)"
                  >编辑</el-button
                >
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
                  v-for="item in lineForm.Id ? lineSiteList : allSites"
                  :key="item.LocationId"
                  :label="item.LocationName"
                  :value="item.LocationId"
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
                  v-for="item in lineForm.Id ? lineSiteList : allSites"
                  :key="item.LocationId"
                  :label="item.LocationName"
                  :value="item.LocationId"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="8">
          <el-col :span="8">
            <el-form-item label="全程(分钟)">
              <el-input-number
                v-model="lineForm.JourneyTime"
                :min="0"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优惠票价(元)">
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
            <el-form-item label="原票价(元)">
              <el-input-number
                v-model="lineForm.SitePrice"
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
      <div class="panel__head">
        <div class="panel__tools">
          <el-button type="primary" size="mini" @click="openLineSiteAdd"
            >新增站点</el-button
          >
          <el-button size="mini" @click="loadLineSites">刷新</el-button>
        </div>
      </div>
      <el-table
        v-loading="lineSiteLoading"
        :data="lineSiteList"
        border
        size="mini"
        max-height="420"
        empty-text="还没有设置上车点/下车点，点「新增站点」添加"
      >
        <el-table-column prop="Sort" label="序号" width="70" align="center" />
        <el-table-column prop="LocationName" label="站点" min-width="150" />
        <el-table-column label="类型" width="110" align="center">
          <template slot-scope="scope">
            <el-tag
              size="mini"
              :type="scope.row.SType === 1 ? 'success' : 'warning'"
            >
              {{ scope.row.SType === 1 ? '出发地' : '目的地' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="ArrivalMinute"
          label="到达(分)"
          width="90"
          align="center"
        />
        <el-table-column
          prop="StayMinute"
          label="停留(分)"
          width="90"
          align="center"
        />
        <el-table-column label="操作" width="120" align="center">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="mini"
              @click="openLineSiteEdit(scope.row)"
              >编辑</el-button
            >
            <el-button
              type="text"
              size="mini"
              class="danger-text"
              @click="removeLineSite(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button size="small" @click="lineSiteVisible = false"
          >关闭</el-button
        >
      </span>
    </el-dialog>

    <!-- 新增 / 编辑单个线路站点 -->
    <el-dialog
      :title="lineSiteForm.Id ? '编辑线路站点' : '新增线路站点'"
      :visible.sync="lineSiteEditVisible"
      width="440px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form :model="lineSiteForm" label-width="96px" size="mini">
        <el-form-item label="站点">
          <el-select
            v-model="lineSiteForm.LocationId"
            filterable
            clearable
            placeholder="选择站点"
            class="full"
            :disabled="!!lineSiteForm.Id"
          >
            <el-option
              v-for="item in allSites"
              :key="item.Id"
              :label="item.LocationName"
              :value="item.Id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="站点类型">
          <el-radio-group v-model="lineSiteForm.SType">
            <el-radio :label="1">出发地（上车）</el-radio>
            <el-radio :label="2">目的地（下车）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="lineSiteForm.Sort"
            :min="1"
            :controls="false"
            class="full"
          />
        </el-form-item>
        <el-form-item label="到达(分钟)">
          <el-input-number
            v-model="lineSiteForm.ArrivalMinute"
            :min="0"
            :controls="false"
            class="full"
          />
        </el-form-item>
        <el-form-item label="停留(分钟)">
          <el-input-number
            v-model="lineSiteForm.StayMinute"
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

    <!-- 新建 / 编辑班车模板 -->
    <el-dialog
      :title="tplForm.Id ? '编辑班车模板 #' + tplForm.Id : '新建班车模板'"
      :visible.sync="tplDialogVisible"
      width="620px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="tplForm"
        :model="tplForm"
        :rules="tplRules"
        label-width="96px"
        size="mini"
      >
        <el-form-item label="所属线路" prop="LineId">
          <el-select
            v-model="tplForm.LineId"
            filterable
            placeholder="选择线路"
            class="full"
            @change="handleTplLineChange"
          >
            <el-option
              v-for="item in tplLines"
              :key="item.Id"
              :label="item.LineName"
              :value="item.Id"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="8">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="StartTime">
              <el-time-picker
                v-model="tplForm.StartTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="08:30"
                class="full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="EndTime">
              <el-time-picker
                v-model="tplForm.EndTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="10:30"
                class="full"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="8">
          <el-col :span="12">
            <el-form-item label="司机">
              <el-select
                v-model="tplForm.DriverId"
                filterable
                allow-create
                default-first-option
                clearable
                placeholder="选择司机，接口未返回时可直接填 ID"
                class="full"
              >
                <el-option
                  v-for="item in tplDriverOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆 ID">
              <el-select
                v-model="tplForm.VehicleId"
                filterable
                allow-create
                default-first-option
                clearable
                placeholder="选择车辆，接口未返回时可直接填 ID"
                class="full"
              >
                <el-option
                  v-for="item in tplCars"
                  :key="item.Id"
                  :label="item.VehicleNo"
                  :value="item.Id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="8">
          <el-col :span="12">
            <el-form-item label="票价(元)">
              <el-input-number
                v-model="tplForm.JourneyPrice"
                :min="0"
                :precision="2"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="站点价(元)">
              <el-input-number
                v-model="tplForm.SitePrice"
                :min="0"
                :precision="2"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="8">
          <el-col :span="12">
            <el-form-item label="间隔(分钟)">
              <el-input-number
                v-model="tplForm.IntervalTime"
                :min="0"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number
                v-model="tplForm.Sort"
                :min="0"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="是否启用">
          <el-switch
            v-model="tplForm.IsOpen"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
        <el-form-item label="所属组织">
          <el-input v-model="tplForm.OrganizationId" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="tplForm.Remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="tplDialogVisible = false"
          >取消</el-button
        >
        <el-button
          type="primary"
          size="small"
          :loading="tplSaving"
          @click="saveTpl"
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
  SitePrice: 0,
  Mileage: 0,
})

// 兼容后端不同的列表包装：data 直接是数组 / { data: [] } / { List: [] }
function toList(res) {
  const d = res && res.data
  if (Array.isArray(d)) return d
  if (d && typeof d === 'object') {
    if (Array.isArray(d.data)) return d.data
    if (Array.isArray(d.List)) return d.List
    if (Array.isArray(d.Data)) return d.Data
  }
  return []
}

// 从对象里按候选字段名取第一个有值的
function pickValue(obj, keys) {
  for (let i = 0; i < keys.length; i++) {
    const val = obj ? obj[keys[i]] : undefined
    if (val !== undefined && val !== null && val !== '') return val
  }
  return ''
}

// 下拉文案：主名称 + 副信息（手机号 / 座位数）
function buildLabel(obj, { name, extra }) {
  const main = pickValue(obj, name) || '未命名'
  const sub = pickValue(obj, extra)
  return sub ? `${main} / ${sub}` : String(main)
}

const emptyTpl = () => ({
  Id: null,
  LineId: null,
  DriverId: '',
  VehicleId: 1,
  StartTime: '',
  EndTime: '',
  JourneyPrice: 0,
  SitePrice: 0,
  SitePrice: 0,
  IntervalTime: 0,
  IsOpen: true,
  Remark: '',
  Sort: 1,
  OrganizationId: DEFAULT_ORG,
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
        SType: 1,
        Sort: 1,
        ArrivalMinute: 0,
        StayMinute: 0,
        OrganizationId: DEFAULT_ORG,
      },
      // —— 班车模板 ——
      tplList: [],
      tplLoading: false,
      tplLineId: null,
      tplPage: { pageIndex: 1, pageSize: 10 },
      tplDialogVisible: false,
      tplSaving: false,
      tplForm: emptyTpl(),
      // 模板下拉数据：线路 / 司机 / 车辆（来自后台字典接口）
      tplLines: [],
      tplDrivers: [],
      tplCars: [],
      tplOptionsLoading: false,
      tplRules: {
        LineId: [{ required: true, message: '请选择线路', trigger: 'change' }],
        StartTime: [
          { required: true, message: '请选择开始时间', trigger: 'change' },
        ],
        EndTime: [
          { required: true, message: '请选择结束时间', trigger: 'change' },
        ],
      },
    }
  },
  computed: {
    // 后端未严格按 LineId 过滤模板，这里再兜一层
    filteredTemplates() {
      if (!this.tplLineId) return this.tplList
      return this.tplList.filter((item) => item.LineId === this.tplLineId)
    },
    pagedTemplates() {
      const start = (this.tplPage.pageIndex - 1) * this.tplPage.pageSize
      return this.filteredTemplates.slice(start, start + this.tplPage.pageSize)
    },
    // 司机下拉：只取 /BusOrder/GetBusDriverList 的返回，不从模板数据里提取
    tplDriverOptions() {
      return this.tplDrivers.map((item) => ({
        value: pickValue(item, ['Id', 'DriverId', 'UserId']),
        label: buildLabel(item, {
          name: ['DriverName', 'Name', 'RealName', 'UserName'],
          extra: ['Phone', 'DriverPhone', 'Mobile', 'Tel'],
        }),
      }))
    },
    // 车辆下拉：只取 /BusOrder/GetBusCarList 的返回，不从模板数据里提取
    tplCarOptions() {
      return this.tplCars.map((item) => ({
        value: pickValue(item, ['Id', 'VehicleId', 'CarId']),
        label: buildLabel(item, {
          name: ['CarNumber', 'PlateNumber', 'VehicleName', 'CarNo', 'Name'],
          extra: ['SeatNum', 'SeatCount', 'Seats'],
        }),
      }))
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
    this.loadTplOptions()
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
        console.log('loadAllSites', res)
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
    async openLineDialog(row) {
      console.log('openLineDialog', row)
      this.currentLine = row
      await this.loadLineSites()
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
            SitePrice: detail.SitePrice || 0,
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
          SitePrice: this.lineForm.SitePrice || 0, // 后端接口要求传 SitePrice，暂时写死为 0
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
          Message.success(
            this.lineForm.Id
              ? '保存成功'
              : '线路创建成功，请在该线路的「站点编排」里添加上车点/下车点',
          )
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
      console.log('openLineSites', line)
      this.currentLine = line
      this.lineSiteVisible = true
      if (!this.allSites.length) this.loadAllSites()
      await this.loadLineSites()
    },
    async loadLineSites() {
      console.log('1', this.currentLine)
      if (!this.currentLine) return
      this.lineSiteLoading = true
      try {
        const res = await request({
          url: '/BusOrder/GetBusLineSitePageList',
          method: 'post',
          data: {
            LineId: this.currentLine.Id,
            pageIndex: 1,
            pageSize: 200,
          },
        })
        const list = res.data || []
        // 按序号排，序号相同按 Id 排，保证顺序稳定
        this.lineSiteList = list.sort(
          (a, b) => (a.Sort || 0) - (b.Sort || 0) || a.Id - b.Id,
        )
        console.log('有条件的站点', this.currentLine.Id, this.currentLine)
      } catch (e) {
        this.lineSiteList = []
      } finally {
        this.lineSiteLoading = false
      }
    },
    // 新增：序号默认排到最后
    openLineSiteAdd() {
      this.lineSiteForm = {
        Id: null,
        LineId: this.currentLine ? this.currentLine.Id : null,
        LocationId: null,
        SType: 1,
        Sort: this.lineSiteList.length + 1,
        ArrivalMinute: 0,
        StayMinute: 0,
        OrganizationId:
          (this.currentLine && this.currentLine.OrganizationId) || DEFAULT_ORG,
      }
      this.lineSiteEditVisible = true
    },
    openLineSiteEdit(row) {
      this.lineSiteForm = {
        Id: row.Id,
        LineId: row.LineId,
        LocationId: row.LocationId,
        SType: row.SType,
        Sort: row.Sort,
        ArrivalMinute: row.ArrivalMinute || 0,
        StayMinute: row.StayMinute || 0,
        OrganizationId: row.OrganizationId || DEFAULT_ORG,
      }
      this.lineSiteEditVisible = true
    },
    async saveLineSite() {
      const form = this.lineSiteForm
      if (!form.LocationId) {
        Message.warning('请选择站点')
        return
      }
      this.lineSiteSaving = true
      const payload = {
        OrganizationId: form.OrganizationId,
        LocationId: form.LocationId,
        Sort: form.Sort,
        LineId: form.LineId,
        SType: form.SType,
        ArrivalMinute: form.ArrivalMinute || 0,
        StayMinute: form.StayMinute || 0,
      }
      try {
        if (form.Id) {
          await request({
            url: '/BusOrder/UpdateBusLineSite',
            method: 'post',
            data: Object.assign(payload, { Id: form.Id }),
          })
        } else {
          // 新增走批量接口，单条也按数组提交
          await request({
            url: '/BusOrder/CreateBusLineSiteList',
            method: 'post',
            data: [payload],
          })
        }
        Message.success('保存成功')
        this.lineSiteEditVisible = false
        this.loadLineSites()
      } catch (e) {
        // 拦截器已提示
      } finally {
        this.lineSiteSaving = false
      }
    },
    // 删除线路站点
    async removeLineSite(row) {
      try {
        await this.$confirm(
          `确定把「${row.LocationName}」从该线路上移除吗？`,
          '提示',
          {
            type: 'warning',
            confirmButtonText: '删除',
            cancelButtonText: '取消',
          },
        )
      } catch (e) {
        return // 取消
      }
      try {
        await request({
          url: '/BusOrder/DeleteBusLineSite',
          method: 'post',
          data: { Id: row.Id },
        })
        Message.success('删除成功')
        this.loadLineSites()
      } catch (e) {
        // 接口未上线时（404）拦截器已提示，这里补一句上下文
        Message.warning(
          '删除失败，请确认后端已提供 /BusOrder/DeleteBusLineSite',
        )
      }
    },

    // ==================== 班车模板 ====================
    async loadTemplates() {
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
    // 模板下拉数据：线路 / 司机 / 车辆，全部直接取后台接口返回
    // （司机、车辆接口未上线时静默失败，下拉为空；输入框仍支持手填 ID）
    async loadTplOptions() {
      if (this.tplOptionsLoading) return
      this.tplOptionsLoading = true
      try {
        const [lineRes, driverRes, carRes] = await Promise.all([
          request({
            url: '/BusOrder/GetBusLineList',
            method: 'get',
            silent: true,
          }).catch(() => null),
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
        this.tplLines = toList(lineRes)
        this.tplDrivers = toList(driverRes)
        this.tplCars = toList(carRes)
      } finally {
        this.tplOptionsLoading = false
      }
    },
    // 新建 / 编辑模板：编辑时先拉详情
    async openTplDialog(row) {
      this.loadTplOptions()
      if (!this.tplList.length) this.loadTemplates()
      if (row && row.Id) {
        try {
          const res = await request({
            url: '/BusOrder/GetBusDepartureTemplateInfo',
            method: 'get',
            params: { Id: row.Id },
          })
          const detail = res.data || {}
          this.tplForm = Object.assign(emptyTpl(), {
            Id: detail.Id,
            LineId: detail.LineId,
            DriverId: detail.DriverId || '',
            VehicleId: detail.VehicleId || 1,
            StartTime: (detail.StartTime || '').slice(0, 5),
            EndTime: (detail.EndTime || '').slice(0, 5),
            JourneyPrice: detail.JourneyPrice || 0,
            SitePrice: detail.SitePrice || 0,
            IntervalTime: detail.IntervalTime || 0,
            IsOpen: detail.IsOpen !== false,
            Remark: detail.Remark || '',
            Sort: detail.Sort || 0,
            OrganizationId: detail.OrganizationId || DEFAULT_ORG,
          })
        } catch (e) {
          return
        }
      } else {
        this.tplForm = emptyTpl()
        this.tplForm.Sort = this.tplList.length + 1
      }
      this.tplDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.tplForm) this.$refs.tplForm.clearValidate()
      })
    },
    // 选线路时带出该线路所属组织（线路只取 GetBusLineList 的返回）
    handleTplLineChange(lineId) {
      const line = this.tplLines.find((item) => item.Id === lineId)
      if (line && line.OrganizationId) {
        this.tplForm.OrganizationId = line.OrganizationId
      }
    },
    saveTpl() {
      this.$refs.tplForm.validate(async (valid) => {
        if (!valid) return
        if (
          this.tplForm.StartTime &&
          this.tplForm.EndTime &&
          this.tplForm.EndTime <= this.tplForm.StartTime
        ) {
          Message.warning('结束时间需要晚于开始时间')
          return
        }
        this.tplSaving = true
        const payload = {
          LineId: this.tplForm.LineId,
          DriverId: this.tplForm.DriverId,
          // 车辆下拉是 allow-create 的，手输时是字符串，这里统一转数字
          VehicleId: Number(this.tplForm.VehicleId) || 0,
          StartTime: this.tplForm.StartTime,
          EndTime: this.tplForm.EndTime,
          JourneyPrice: this.tplForm.JourneyPrice || 0,
          SitePrice: this.tplForm.SitePrice || 0,
          IntervalTime: this.tplForm.IntervalTime || 0,
          IsOpen: this.tplForm.IsOpen,
          Remark: this.tplForm.Remark || null,
          Sort: this.tplForm.Sort || 0,
          OrganizationId: this.tplForm.OrganizationId,
        }
        try {
          if (this.tplForm.Id) {
            await request({
              url: '/BusOrder/UpdateBusLineTemplate',
              method: 'post',
              data: Object.assign(payload, { Id: this.tplForm.Id }),
            })
          } else {
            await request({
              url: '/BusOrder/CreateBusLineTemplate',
              method: 'post',
              data: payload,
            })
          }
          Message.success('保存成功')
          this.tplDialogVisible = false
          this.loadTemplates()
        } catch (e) {
          // 拦截器已提示
        } finally {
          this.tplSaving = false
        }
      })
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

  ::v-deep .danger-text {
    color: $danger;
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
