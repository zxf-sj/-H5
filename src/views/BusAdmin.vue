<template>
  <div class="bus-admin">
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <!-- ==================== 站点管理 ==================== -->
      <el-tab-pane label="站点管理" name="site">
        <el-row :gutter="12" type="flex" class="site-row">
          <el-col :xs="24" :md="14">
            <div class="panel site-map-panel">
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
            <div class="panel site-form-panel">
              <div class="panel__head">
                <span class="panel__title">{{
                  siteForm.Id ? '编辑站点' : '新增站点'
                }}</span>
                <span class="panel__tip">带 * 为必填</span>
              </div>
              <el-form
                ref="siteForm"
                :model="siteForm"
                :rules="siteRules"
                label-width="96px"
                size="mini"
              >
                <el-form-item label="站点名称" prop="LocationName">
                  <el-input
                    v-model="siteForm.LocationName"
                    placeholder="如：太原南站"
                    clearable
                  />
                </el-form-item>
                <el-form-item label="区域权限" prop="LocationRole">
                  <el-select
                    v-model="siteForm.LocationRole"
                    filterable
                    clearable
                    placeholder="选择区域权限"
                    class="full"
                    :loading="locationRoleLoading"
                  >
                    <el-option
                      v-for="item in locationRoleList"
                      :key="item.Value"
                      :label="item.Text"
                      :value="item.Value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="详细地址">
                  <el-input
                    v-model="siteForm.DetailAddress"
                    type="textarea"
                    :rows="2"
                    placeholder="点击地图后自动填充，可手动修改"
                  />
                </el-form-item>
                <el-form-item label="经度 / 纬度">
                  <div class="two-col">
                    <el-input-number
                      v-model="siteForm.Longitude"
                      :precision="6"
                      :step="0.0001"
                      :controls="false"
                      placeholder="经度 112.617734"
                      class="full"
                    />
                    <el-input-number
                      v-model="siteForm.Latitude"
                      :precision="6"
                      :step="0.0001"
                      :controls="false"
                      placeholder="纬度 37.757249"
                      class="full"
                    />
                  </div>
                </el-form-item>
                <el-form-item label="省 / 市 / 县">
                  <div class="two-col">
                    <el-input v-model="siteForm.Province" placeholder="省" />
                    <el-input v-model="siteForm.City" placeholder="市" />
                    <el-input v-model="siteForm.County" placeholder="区 / 县" />
                  </div>
                </el-form-item>
                <el-form-item label="行程 / 状态">
                  <div class="two-col">
                    <el-select
                      v-model="siteForm.ReturnTrip"
                      placeholder="选择适用行程"
                      class="full"
                    >
                      <el-option
                        v-for="item in returnTripOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                    <el-switch
                      v-model="siteForm.Status"
                      active-text="启用"
                      inactive-text="禁用"
                    />
                  </div>
                </el-form-item>
                <el-form-item label="站点图片">
                  <el-upload
                    :action="''"
                    :auto-upload="false"
                    :show-file-list="false"
                    :limit="9"
                    accept="image/*"
                    :on-change="handleSiteImgChange"
                  >
                    <div class="site-img-list">
                      <div
                        v-for="(img, idx) in siteForm.ImgList"
                        :key="idx"
                        class="site-img-item"
                      >
                        <img
                          :src="siteImgSrc(img)"
                          @click="previewSiteImg(idx)"
                        />
                        <i
                          class="el-icon-close site-img-del"
                          @click="removeSiteImg(idx, img)"
                        ></i>
                      </div>
                      <div
                        v-if="siteForm.ImgList.length < 9"
                        class="site-img-add"
                      >
                        <i class="el-icon-plus"></i>
                        <div class="site-img-add__text">上传图片</div>
                      </div>
                    </div>
                  </el-upload>
                  <div v-if="siteImgUploading" class="site-img-uploading">
                    上传中 {{ siteImgUploadProgress }}%（{{
                      siteImgUploadName
                    }}）
                  </div>
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
            <div class="panel__tools">
              <el-input
                v-model="siteKeyword"
                size="mini"
                placeholder="搜索站点名称"
                clearable
                class="site-search"
                @keyup.enter.native="searchSites"
                @clear="searchSites"
              />
              <el-button size="mini" type="primary" @click="searchSites"
                >搜索</el-button
              >
              <el-button type="text" size="mini" @click="loadSites()"
                >刷新</el-button
              >
            </div>
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
            <el-table-column label="适用行程" width="90" align="center">
              <template slot-scope="scope">
                {{ returnTripLabel(scope.row.ReturnTrip) }}
              </template>
            </el-table-column>
            <!-- <el-table-column label="区域权限" width="140" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ locationRoleLabel(scope.row.LocationRole) }}
              </template>
            </el-table-column> -->
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
            <el-table-column label="操作" width="180" align="center">
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
                <el-button
                  type="text"
                  size="mini"
                  class="danger-text"
                  @click="removeSite(scope.row)"
                  >删除</el-button
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

      <!-- ==================== 路线管理 ==================== -->
      <el-tab-pane label="路线管理" name="line">
        <div class="panel">
          <div class="panel__head">
            <span class="panel__title">巴士路线（共 {{ lineTotal }} 条）</span>
            <div class="panel__tools">
              <el-button type="primary" size="mini" @click="openLineDialog()"
                >新建路线</el-button
              >
              <el-button
                size="mini"
                type="success"
                :loading="lineCopying"
                @click="copyLine"
                >复制路线</el-button
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
            highlight-current-row
            @row-click="handleLineRowClick"
          >
            <el-table-column width="50" align="center">
              <template slot-scope="scope">
                <el-radio
                  :label="scope.row.Id"
                  v-model="selectedLineId"
                  class="line-radio"
                  >&nbsp;</el-radio
                >
              </template>
            </el-table-column>
            <el-table-column prop="LineName" label="路线名称" min-width="130" />
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
              label="基准票价(元)"
              width="90"
              align="center"
            />
            <el-table-column
              prop="Mileage"
              label="里程(km)"
              width="90"
              align="center"
            />
            <el-table-column label="操作" width="200" align="center">
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
                <el-button
                  type="text"
                  size="mini"
                  class="danger-text"
                  @click="removeLine(scope.row)"
                  >删除</el-button
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
            <span class="panel__title">运营路线时刻模板</span>
            <div class="panel__tools">
              <el-select
                v-model="tplLineId"
                size="mini"
                clearable
                filterable
                placeholder="全部路线"
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
              <el-button
                size="mini"
                type="success"
                :loading="tplCopying"
                @click="copyTpl"
                >复制模板</el-button
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
            highlight-current-row
            @row-click="handleTplRowClick"
          >
            <el-table-column width="50" align="center">
              <template slot-scope="scope">
                <el-radio
                  :label="scope.row.Id"
                  v-model="selectedTplId"
                  class="line-radio"
                  >&nbsp;</el-radio
                >
              </template>
            </el-table-column>
            <el-table-column prop="LineId_Name" label="路线" min-width="120" />
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
              label="基准票价(元)"
              width="90"
              align="center"
            />
            <!-- <el-table-column
              prop="SitePrice"
              label="站点价(元)"
              width="100"
              align="center"
            /> -->
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
            <el-table-column label="操作" width="130" align="center">
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="mini"
                  @click="openTplDialog(scope.row)"
                  >编辑</el-button
                >
                <el-button
                  type="text"
                  size="mini"
                  class="danger-text"
                  @click="removeTemplate(scope.row)"
                  >删除</el-button
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

      <!-- ==================== 车辆管理 ==================== -->
      <el-tab-pane label="车辆管理" name="vehicle">
        <div class="panel">
          <div class="panel__head">
            <span class="panel__title"
              >巴士车辆（共 {{ vehicleTotal }} 辆）</span
            >
            <div class="panel__tools">
              <el-input
                v-model="vehicleSearch.VehicleNo"
                size="mini"
                clearable
                placeholder="车牌号"
                class="line-filter"
                @keyup.enter.native="handleVehicleSearch"
                @clear="handleVehicleSearch"
              />
              <el-select
                v-model="vehicleSearch.CarStatus"
                size="mini"
                clearable
                placeholder="车辆状态"
                class="line-filter"
                @change="handleVehicleSearch"
              >
                <el-option
                  v-for="item in vehicleStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-button type="primary" size="mini" @click="handleVehicleSearch"
                >查询</el-button
              >
              <el-button size="mini" @click="resetVehicleSearch"
                >重置</el-button
              >
              <el-button type="primary" size="mini" @click="openVehicleDialog()"
                >新建车辆</el-button
              >
              <el-button size="mini" @click="loadVehicles()">刷新</el-button>
            </div>
          </div>
          <el-table
            v-loading="vehicleLoading"
            :data="vehicleList"
            border
            size="mini"
            style="width: 100%"
          >
            <el-table-column
              prop="VehicleNo"
              label="车牌号"
              min-width="110"
              align="center"
            />
            <el-table-column label="车辆类型" min-width="100" align="center">
              <template slot-scope="scope">
                {{ vehicleTypeLabel(scope.row) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="SeatTotal"
              label="座位数"
              width="80"
              align="center"
            />
            <el-table-column label="是否启用" width="90" align="center">
              <template slot-scope="scope">
                <el-tag
                  size="mini"
                  :type="scope.row.IsUse ? 'success' : 'info'"
                >
                  {{ scope.row.IsUse ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="车辆状态" width="100" align="center">
              <template slot-scope="scope">
                <el-tag size="mini" type="warning">
                  {{ vehicleStatusLabel(scope.row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="BuyDate"
              label="购车日期"
              width="110"
              align="center"
            />
            <el-table-column label="司机" min-width="120" align="center">
              <template slot-scope="scope">
                {{ scope.row.DriverId_Name || scope.row.DriverId || '-' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="Remark"
              label="备注"
              min-width="120"
              show-overflow-tooltip
            />
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="mini"
                  @click="openVehicleDialog(scope.row)"
                  >编辑</el-button
                >
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            :current-page="vehiclePage.pageIndex"
            :page-size="vehiclePage.pageSize"
            :page-sizes="[10, 12, 20, 50]"
            :total="vehicleTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="handleVehicleSizeChange"
            @current-change="handleVehiclePageChange"
          >
          </el-pagination>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新建 / 编辑路线 -->
    <el-dialog
      :title="lineForm.Id ? '编辑路线 #' + lineForm.Id : '新建路线'"
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
        <el-form-item label="路线名称" prop="LineName">
          <el-input v-model="lineForm.LineName" placeholder="如：太原-文水" />
        </el-form-item>
        <el-row :gutter="8">
          <el-col :span="12">
            <el-form-item label="起点站" prop="StatingLocation">
              <el-select
                v-model="lineForm.StatingLocation"
                filterable
                remote
                reserve-keyword
                :remote-method="remoteMethodStart"
                :loading="startSearchLoading"
                placeholder="输入关键字搜索站点"
                class="full"
              >
                <el-option
                  v-for="item in startSites"
                  :key="item.Id"
                  :label="item.LocationName + ' - ' + item.ReturnTrip_Name"
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
                remote
                reserve-keyword
                :remote-method="remoteMethodEnd"
                :loading="endSearchLoading"
                placeholder="输入关键字搜索站点"
                class="full"
              >
                <el-option
                  v-for="item in endSites"
                  :key="item.Id"
                  :label="item.LocationName + ' - ' + item.ReturnTrip_Name"
                  :value="item.Id"
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
            <el-form-item label="基准票价(元)">
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
          <el-input v-model="lineForm.OrganizationId" disabled />
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

    <!-- 路线站点编排 -->
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

    <!-- 新增 / 编辑单个路线站点 -->
    <el-dialog
      :title="lineSiteForm.Id ? '编辑路线站点' : '新增路线站点'"
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
              :label="
                item.LocationName +
                ' (' +
                returnTripLabel(item.ReturnTrip) +
                ')'
              "
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
          <el-input v-model="lineSiteForm.OrganizationId" disabled />
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
        <el-form-item label="所属路线" prop="LineId">
          <el-select
            v-model="tplForm.LineId"
            filterable
            placeholder="选择路线"
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
            <el-form-item label="基准票价(元)">
              <el-input-number
                v-model="tplForm.SitePrice"
                :min="0"
                :precision="2"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优惠票价(元)">
              <el-input-number
                v-model="tplForm.JourneyPrice"
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
          <el-input v-model="tplForm.OrganizationId" disabled />
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

    <!-- 新建 / 编辑车辆 -->
    <el-dialog
      :title="vehicleForm.Id ? '编辑车辆 #' + vehicleForm.Id : '新建车辆'"
      :visible.sync="vehicleDialogVisible"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="vehicleForm"
        :model="vehicleForm"
        :rules="vehicleRules"
        label-width="96px"
        size="mini"
      >
        <el-form-item label="车牌号" prop="VehicleNo">
          <el-input
            v-model="vehicleForm.VehicleNo"
            placeholder="如：晋A9XXXD"
          />
        </el-form-item>
        <el-row :gutter="8">
          <el-col :span="12">
            <el-form-item label="车辆类型" prop="VehicleType">
              <el-select
                v-model="vehicleForm.VehicleType"
                placeholder="选择车辆类型"
                class="full"
              >
                <el-option
                  v-for="item in vehicleTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="座位数" prop="SeatTotal">
              <el-input-number
                v-model="vehicleForm.SeatTotal"
                :min="1"
                :controls="false"
                class="full"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="8">
          <el-col :span="12">
            <el-form-item label="车辆状态" prop="CarStatus">
              <el-select
                v-model="vehicleForm.CarStatus"
                placeholder="选择车辆状态"
                class="full"
              >
                <el-option
                  v-for="item in vehicleStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="购车日期">
              <el-date-picker
                v-model="vehicleForm.BuyDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="选择购车日期"
                class="full"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="司机">
          <el-select
            v-model="vehicleForm.DriverId"
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
        <el-form-item label="是否启用">
          <el-switch
            v-model="vehicleForm.IsUse"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="vehicleForm.Remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="vehicleDialogVisible = false"
          >取消</el-button
        >
        <el-button
          type="primary"
          size="small"
          :loading="vehicleSaving"
          @click="saveVehicle"
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
import { BASE_API } from '@/config/env'

// 图片地址补全：后端返回的是相对路径（如 /wxImg/xxx.jpg），
// 开发环境需拼 /api 走 devServer 代理，生产与后端同源则保持相对路径
const resolveImgUrl = (p) => {
  if (!p) return ''
  if (/^(https?:)?\/\//i.test(p) || /^data:/i.test(p)) return p
  const base = BASE_API === '/' ? '' : BASE_API
  return base + (p.charAt(0) === '/' ? p : '/' + p)
}

// 默认组织：与后台「巴士订单」现有数据一致（山西畅亿科技有限公司）
const DEFAULT_ORG = '200004-49a09eab654f4064ae2031ee76bffd90'

const emptySite = () => ({
  Id: null,
  LocationName: '',
  // 地址区域权限：值来自 /BusOrder/GetMyLocationRoleList 返回的 Id
  LocationRole: null,
  Longitude: null,
  Latitude: null,
  DetailAddress: '',
  Province: '',
  City: '',
  County: '',
  // 适用行程：0=公用 1=去程 2=返程
  ReturnTrip: 0,
  OrganizationId: DEFAULT_ORG,
  Status: true,
  // 站点图片集合：[{ Id: 0, ImgPath: "" }]
  ImgList: [],
})

// 分片大小 4MB，与小程序端捎货图片上传保持一致
const CHUNK_SIZE = 4 * 1024 * 1024
// 站点图片大小上限 100K
const IMG_MAX_SIZE = 100 * 1024

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
  IntervalTime: 0,
  IsOpen: true,
  Remark: '',
  Sort: 1,
  OrganizationId: DEFAULT_ORG,
})

const emptyVehicle = () => ({
  Id: null,
  VehicleNo: '',
  VehicleType: null,
  SeatTotal: null,
  IsUse: true,
  CarStatus: null,
  BuyDate: '',
  Remark: null,
  DriverId: '',
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
      returnTripOptions: [
        { value: 0, label: '公用' },
        { value: 1, label: '去程' },
        { value: 2, label: '返程' },
      ],
      // 地址区域权限字典（我的权限范围）
      locationRoleList: [],
      locationRoleLoading: false,
      siteForm: emptySite(),
      siteSaving: false,
      siteImgUploading: false,
      siteImgUploadProgress: 0,
      siteImgUploadName: '',
      siteLoading: false,
      siteList: [],
      siteTotal: 0,
      sitePage: { pageIndex: 1, pageSize: 10 },
      siteKeyword: '',
      allSites: [],
      startSites: [],
      endSites: [],
      startSearchLoading: false,
      endSearchLoading: false,
      siteRules: {
        LocationName: [
          { required: true, message: '请输入站点名称', trigger: 'blur' },
        ],
      },
      // —— 路线 ——
      lineList: [],
      lineTotal: 0,
      lineLoading: false,
      linePage: { pageIndex: 1, pageSize: 10 },
      allLines: [],
      lineDialogVisible: false,
      lineSaving: false,
      lineCopying: false,
      selectedLineId: null,
      lineForm: emptyLine(),
      lineRules: {
        LineName: [
          { required: true, message: '请输入路线名称', trigger: 'blur' },
        ],
        StatingLocation: [
          { required: true, message: '请选择起点站', trigger: 'change' },
        ],
        EndLocation: [
          { required: true, message: '请选择终点站', trigger: 'change' },
        ],
      },
      // —— 路线站点 ——
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
      tplCopying: false,
      selectedTplId: null,
      tplForm: emptyTpl(),
      // 模板下拉数据：路线 / 司机 / 车辆（来自后台字典接口）
      tplLines: [],
      tplDrivers: [],
      tplCars: [],
      tplOptionsLoading: false,
      tplRules: {
        LineId: [{ required: true, message: '请选择路线', trigger: 'change' }],
        StartTime: [
          { required: true, message: '请选择开始时间', trigger: 'change' },
        ],
        EndTime: [
          { required: true, message: '请选择结束时间', trigger: 'change' },
        ],
      },
      // —— 车辆管理 ——
      vehicleList: [],
      vehicleTotal: 0,
      vehicleLoading: false,
      vehiclePage: { pageIndex: 1, pageSize: 12 },
      vehicleSearch: { VehicleNo: '', CarStatus: null },
      // 字典：车辆类型 / 车辆状态
      vehicleTypeList: [],
      vehicleStatusList: [],
      vehicleDialogVisible: false,
      vehicleSaving: false,
      vehicleForm: emptyVehicle(),
      vehicleRules: {
        VehicleNo: [
          { required: true, message: '请输入车牌号', trigger: 'blur' },
        ],
        VehicleType: [
          { required: true, message: '请选择车辆类型', trigger: 'change' },
        ],
        SeatTotal: [
          { required: true, message: '请输入座位数', trigger: 'blur' },
        ],
        CarStatus: [
          { required: true, message: '请选择车辆状态', trigger: 'change' },
        ],
      },
      vehicleDictLoaded: false,
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
    // 车辆类型下拉：/BusOrder/GetBusVehicleTypeList
    vehicleTypeOptions() {
      return this.vehicleTypeList.map((item) => ({
        value: pickValue(item, ['Id', 'Value', 'TypeValue', 'VehicleType']),
        label:
          pickValue(item, [
            'Name',
            'TypeName',
            'VehicleType_Name',
            'Title',
            'Text',
            'Remark',
          ]) || String(item.Id ?? item.Value ?? ''),
      }))
    },
    // 车辆状态下拉：/BusOrder/BusCarStatusList
    vehicleStatusOptions() {
      return this.vehicleStatusList.map((item) => ({
        value: pickValue(item, ['Id', 'Value', 'Status', 'CarStatus']),
        label:
          pickValue(item, [
            'Name',
            'StatusName',
            'CarStatus_Name',
            'Title',
            'Text',
            'Remark',
          ]) || String(item.Id ?? item.Value ?? ''),
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
    // 默认全量站点标注
    this.siteMarkers = []
  },
  mounted() {
    this.initMap()
    this.loadSites()
    this.loadAllSites()
    this.loadLines()
    this.loadTemplates()
    this.loadTplOptions()
    this.loadLocationRoles()
    this.loadVehicleDicts()
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
        // 比例标尺
        map.addControl(new BMapGL.ScaleControl())
        map.addEventListener('click', (e) => this.handleMapClick(e.latlng))
        this.map = map
        this.geocoder = new BMapGL.Geocoder()
        // 地点检索：结果自己渲染成下拉面板，不用地图自带的检索面板
        this.localSearch = new BMapGL.LocalSearch(map, {
          pageCapacity: 10,
          onSearchComplete: (results) => this.handleSearchComplete(results),
        })
        this.mapReady = true
        this.siteLabels = []
        // 进入页面默认标注全部站点
        this.showAllSiteMarkers()
        // 等高布局生效后重新计算地图尺寸
        this.$nextTick(() => this.resizeMap())
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
    // 默认标注全部站点（/BusOrder/GetSearchBusLocation 后台所有站点）
    async showAllSiteMarkers() {
      if (!this.map || !this.BMapGL) return
      if (!this.allSites.length) await this.loadAllSites()
      const list = (this.allSites || []).filter(
        (s) => s && Number(s.Longitude) && Number(s.Latitude),
      )
      if (!list.length) return
      this.siteMarkers = list.map((s) => {
        const point = new this.BMapGL.Point(
          Number(s.Longitude),
          Number(s.Latitude),
        )
        const mk = new this.BMapGL.Marker(point)
        mk.addEventListener('click', () => {
          this.map.centerAndZoom(point, 16)
        })
        return mk
      })
      this.siteMarkers.forEach((mk) => this.map.addOverlay(mk))
      // 站点名称标注
      this.siteLabels = []
      list.forEach((s) => {
        this.createSiteLabel(
          s.LocationName,
          Number(s.Longitude),
          Number(s.Latitude),
        )
      })
      // 自动缩放到能看全所有站点
      if (this.siteMarkers.length > 1) {
        this.map.setViewport(this.siteMarkers.map((mk) => mk.getPosition()))
      } else {
        this.map.centerAndZoom(this.siteMarkers[0].getPosition(), 15)
      }
    },
    // 清除默认全量标注（进入编辑时调用，避免和编辑标注冲突）
    clearSiteMarkers() {
      if (!this.map) return
      ;(this.siteMarkers || []).forEach((mk) => this.map.removeOverlay(mk))
      ;(this.siteLabels || []).forEach((lb) => this.map.removeOverlay(lb))
      this.siteMarkers = []
      this.siteLabels = []
    },
    // 地图上的站点名称标签
    createSiteLabel(name, lng, lat) {
      if (!this.BMapGL.Label || !name) return null
      const label = new this.BMapGL.Label(name, {
        position: new this.BMapGL.Point(lng, lat),
        offset: new this.BMapGL.Size(0, -28),
      })
      label.setStyle({
        color: '#1f2d3d',
        fontSize: '12px',
        height: '20px',
        lineHeight: '20px',
        padding: '0 6px',
        border: '1px solid #c8d6e5',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.92)',
        whiteSpace: 'nowrap',
      })
      this.map.addOverlay(label)
      this.siteLabels.push(label)
      return label
    },
    drawMarker(lng, lat, name) {
      if (!this.map || !this.BMapGL) return
      this.map.clearOverlays()
      this.siteMarkers = []
      this.siteLabels = []
      this.map.addOverlay(
        new this.BMapGL.Marker(new this.BMapGL.Point(lng, lat)),
      )
      this.createSiteLabel(name, lng, lat)
    },
    focusMap(lng, lat, zoom, name) {
      if (!this.map || !this.BMapGL || lng == null || lat == null) return
      this.map.centerAndZoom(new this.BMapGL.Point(lng, lat), zoom || 15)
      this.drawMarker(lng, lat, name)
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
      this.drawMarker(item.longitude, item.latitude, item.title)
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
      if (tab.name === 'vehicle') this.initVehicleTab()
    },

    // ==================== 站点 ====================
    async loadSites() {
      this.siteLoading = true
      try {
        const res = await request({
          url: '/BusOrder/GetPageList',
          method: 'post',
          data: Object.assign(
            {
              pageIndex: this.sitePage.pageIndex,
              pageSize: this.sitePage.pageSize,
            },
            this.siteKeyword ? { LocationName: this.siteKeyword } : {},
          ),
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
    // 全量站点：下拉选项、路线起终点、途经点共用
    async loadAllSites() {
      try {
        const res = await request({
          url: '/BusOrder/GetSearchBusLocation',
          method: 'post',
          data: {},
          noDuplicate: true,
        })
        console.log('loadAllSites', res)
        this.allSites = res.data || []
      } catch (e) {
        this.allSites = []
      }
    },
    // 地址区域权限字典：获取当前登录人拥有的地址区域权限
    async loadLocationRoles() {
      this.locationRoleLoading = true
      try {
        const res = await request({
          url: '/BusOrder/GetMyLocationRoleList',
          method: 'get',
          noDuplicate: true,
        })
        this.locationRoleList = res.data || []
      } catch (e) {
        this.locationRoleList = []
      } finally {
        this.locationRoleLoading = false
      }
    },
    // 路线弹窗站点远程搜索：type 为 'start' / 'end'，两列互不影响
    async searchLocation(query, type) {
      const isStart = type === 'start'
      if (!query) {
        if (!this.allSites.length) await this.loadAllSites()
        if (isStart) this.startSites = this.allSites
        else this.endSites = this.allSites
        return
      }
      if (isStart) this.startSearchLoading = true
      else this.endSearchLoading = true
      try {
        const res = await request({
          url: '/BusOrder/GetSearchBusLocation',
          method: 'post',
          data: { LocationName: query },
          noDuplicate: true,
        })
        const list = res.data || []
        if (isStart) this.startSites = list
        else this.endSites = list
      } catch (e) {
        if (isStart) this.startSites = []
        else this.endSites = []
      } finally {
        if (isStart) this.startSearchLoading = false
        else this.endSearchLoading = false
      }
    },
    remoteMethodStart(query) {
      return this.searchLocation(query, 'start')
    },
    remoteMethodEnd(query) {
      return this.searchLocation(query, 'end')
    },
    // 站点列表搜索：按 LocationName 查询，从第一页开始
    searchSites() {
      this.sitePage.pageIndex = 1
      this.loadSites()
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

    // —— 站点图片相关 ——
    // 兼容不同后端字段：ImgList / SiteImgList / Imgs / Images / rows 等
    _normalizeSiteImgList(detail) {
      const arr =
        detail.ImgList ||
        detail.ImgList ||
        detail.SiteImgList ||
        detail.Imgs ||
        detail.Images ||
        detail.rows ||
        []
      if (!Array.isArray(arr)) return []
      return arr
        .filter(
          (i) => i && (i.ImgPath || i.url || i.Path || typeof i === 'string'),
        )
        .map((i) => {
          if (typeof i === 'string') return { Id: 0, ImgPath: i }
          return { Id: i.Id || 0, ImgPath: i.ImgPath || i.url || i.Path || '' }
        })
    },

    // el-upload :on-change 触发：文件选好后直接分片上传
    handleSiteImgChange(file) {
      if (!file || !file.raw) return
      if ((this.siteForm.ImgList || []).length >= 9) {
        Message.warning('最多上传 9 张图片')
        return
      }
      if (file.raw.size > IMG_MAX_SIZE) {
        Message.warning('图片大小不能超过 100K，请压缩后再上传')
        return
      }
      this._uploadFileChunked(file.raw)
        .then((url) => {
          this.siteForm.ImgList = [
            ...(this.siteForm.ImgList || []),
            { Id: 0, ImgPath: url },
          ]
          Message.success('上传成功')
        })
        .catch((err) => {
          Message.error(err && err.message ? err.message : '上传失败')
        })
    },

    // 分片上传：POST /BusOrder/ImageChunk，参数与捎货保持一致
    // { FileKey, ChunkIndex, ChunkCount, ChunkData(base64) }
    _uploadFileChunked(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('读取文件失败'))
        reader.onload = (e) => {
          const buffer = e.target.result
          const totalSize = buffer.byteLength
          const totalChunks = Math.ceil(totalSize / CHUNK_SIZE)
          const fileId =
            Date.now() + '_' + Math.random().toString(36).substr(2, 9)
          let uploadedCount = 0

          this.siteImgUploading = true
          this.siteImgUploadName = file.name || ''
          this.siteImgUploadProgress = 0

          const sendChunk = (i) => {
            const start = i * CHUNK_SIZE
            const end = Math.min(start + CHUNK_SIZE, totalSize)
            const chunk = buffer.slice(start, end)
            const base64 = this._arrayBufferToBase64(chunk)

            request({
              url: '/BusOrder/ImageChunk',
              method: 'post',
              noDuplicate: false,
              silent: true,
              data: {
                FileKey: fileId,
                ChunkIndex: i,
                ChunkCount: totalChunks,
                ChunkData: base64,
              },
            })
              .then((res) => {
                uploadedCount++
                this.siteImgUploadProgress = Math.round(
                  (uploadedCount / totalChunks) * 100,
                )
                if (uploadedCount === totalChunks) {
                  this.siteImgUploading = false
                  // 最后一片返回完整 URL，兼容 { data: url } / 直接返回 url
                  const url =
                    (res && res.data && (res.data.ImgPath || res.data.url)) ||
                    (typeof (res && res.data) === 'string' ? res.data : '') ||
                    (typeof res === 'string' ? res : '')
                  if (url) resolve(url)
                  else reject(new Error('未返回有效图片地址'))
                } else {
                  sendChunk(i + 1)
                }
              })
              .catch((err) => {
                this.siteImgUploading = false
                reject(err)
              })
          }
          sendChunk(0)
        }
        reader.readAsArrayBuffer(file)
      })
    },

    // ArrayBuffer → base64
    _arrayBufferToBase64(buffer) {
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      // btoa 在现代浏览器可用；IE 不支持但后台已用 Element UI，默认 Chrome/Edge
      return typeof btoa === 'function'
        ? btoa(binary)
        : Buffer.from(buffer).toString('base64')
    },

    // 站点图片可访问地址（相对路径补全为可加载的 URL）
    siteImgSrc(img) {
      return resolveImgUrl((img && (img.ImgPath || img.url)) || '')
    },

    // 预览图片
    previewSiteImg(idx) {
      const urls = (this.siteForm.ImgList || []).map((i) => this.siteImgSrc(i))
      const current = urls[idx]
      if (!current) return
      // Element UI 没有原生图片预览，直接 window.open 兜底；
      // 如需体验更好可换成 el-image 的 preview-src-list
      const img = new Image()
      img.src = current
      const w = window.open('')
      if (w) {
        w.document.write(
          `<img src="${current}" style="max-width:100%;max-height:100vh;margin:auto;display:block;background:#222"/>`,
        )
      }
    },

    // 删除图片：本地立即移除；若图片已有后台 Id 则调删除接口
    async removeSiteImg(idx, img) {
      const path = img.ImgPath || img.url || ''
      try {
        await request({
          url: '/BusOrder/DeleteBusLongitudeImage',
          method: 'get',
          params: { Id: img.Id || 0 },
          silent: true,
        })
      } catch (e) {
        // 删除接口失败不影响本地，避免图片无法移除
      }
      this.siteForm.ImgList = (this.siteForm.ImgList || []).filter(
        (_, i) => i !== idx,
      )
      Message.success('已删除')
    },

    // 适用行程文案：0=公用 1=去程 2=返程
    returnTripLabel(val) {
      const hit = this.returnTripOptions.find(
        (item) => item.value === Number(val),
      )
      return hit ? hit.label : '公用'
    },
    // 区域权限名称：按 LocationRole Id 从字典反查，兼容 Id 类型（number/string）
    locationRoleLabel(val) {
      console.log('----', val)
      if (val === null || val === undefined || val === '') return '-'
      const s = String(val)
      const hit = this.locationRoleList.find((item) => String(item.Value) === s)
      return hit ? hit.Text : '-'
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
          LocationRole:
            detail.LocationRole !== undefined && detail.LocationRole !== null
              ? detail.LocationRole
              : null,
          Longitude: detail.Longitude != null ? Number(detail.Longitude) : null,
          Latitude: detail.Latitude != null ? Number(detail.Latitude) : null,
          DetailAddress: detail.DetailAddress || '',
          Province: detail.Province || '',
          City: detail.City || '',
          County: detail.County || '',
          ReturnTrip:
            detail.ReturnTrip == null ? 0 : Number(detail.ReturnTrip) || 0,
          OrganizationId: detail.OrganizationId || DEFAULT_ORG,
          Status: detail.Status !== false,
          // 回填图片集合，兼容多种字段名
          ImgList: this._normalizeSiteImgList(detail),
        })
        // 进入编辑：先清掉进页面时标注的全部站点，避免与当前站点标注叠在一起
        this.clearSiteMarkers()
        this.focusMap(
          this.siteForm.Longitude,
          this.siteForm.Latitude,
          15,
          this.siteForm.LocationName,
        )
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
          15,
          detail.LocationName || row.LocationName,
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
          LocationRole: this.siteForm.LocationRole ?? null,
          Longitude: this.siteForm.Longitude,
          Latitude: this.siteForm.Latitude,
          DetailAddress: this.siteForm.DetailAddress,
          OrganizationId: this.siteForm.OrganizationId,
          Province: this.siteForm.Province || null,
          City: this.siteForm.City || null,
          County: this.siteForm.County || null,
          ReturnTrip: Number(this.siteForm.ReturnTrip) || 0,
          Status: this.siteForm.Status,
          ImgList: (this.siteForm.ImgList || []).map((img) => ({
            Id: img.Id || 0,
            ImgPath: img.ImgPath || img.url || '',
          })),
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

    // ==================== 路线 ====================
    async loadLines() {
      this.lineLoading = true
      console.log('111')
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
      console.log('222')
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
      if (!this.allSites.length) await this.loadAllSites()
      this.startSites = this.allSites
      this.endSites = this.allSites
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
              : '路线创建成功，请在该路线的「站点编排」里添加上车点/下车点',
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

    // ==================== 路线站点 ====================
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
    // 删除路线站点
    async removeLineSite(row) {
      try {
        await this.$confirm(
          `确定把「${row.LocationName}」从该路线上移除吗？`,
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
          url: '/BusOrder/BusLineSiteDelete',
          method: 'get',
          params: { Id: row.Id },
        })
        Message.success('删除成功')
        this.loadLineSites()
      } catch (e) {
        // 拦截器已提示
      }
    },

    /* ===== 删除（站点 / 路线 / 班车模板）：后端接口暂未提供，先做确认交互 ===== */

    // 删除站点：GET /BusOrder/DeleteBusLocation?Id=
    async removeSite(row) {
      try {
        await this.$confirm(
          `确定删除站点「${row.LocationName}」吗？删除后不可恢复`,
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
          url: '/BusOrder/DeleteBusLocatio',
          method: 'get',
          params: { Id: row.Id },
        })
        Message.success('删除成功')
        this.loadSites()
        this.loadAllSites()
      } catch (e) {
        // 拦截器已提示
      }
    },

    // 路线列表单选：点击行同步选中 radio
    handleLineRowClick(row) {
      if (row && row.Id) this.selectedLineId = row.Id
    },

    // 复制路线：GET /BusOrder/BusLineCopy?Id=
    async copyLine() {
      if (!this.selectedLineId) {
        Message.warning('请先选中一条路线')
        return
      }
      const row = this.lineList.find((i) => i.Id === this.selectedLineId)
      try {
        await this.$confirm(
          `确定复制路线「${row ? row.LineName : this.selectedLineId}」吗？`,
          '提示',
          {
            type: 'warning',
            confirmButtonText: '复制',
            cancelButtonText: '取消',
          },
        )
      } catch (e) {
        return // 取消
      }
      this.lineCopying = true
      try {
        await request({
          url: '/BusOrder/BusLineCopy',
          method: 'get',
          params: { Id: this.selectedLineId },
        })
        Message.success('复制成功')
        this.selectedLineId = null
        this.loadLines()
        this.loadAllLines()
      } catch (e) {
        // 拦截器已提示
      } finally {
        this.lineCopying = false
      }
    },

    // 删除路线：GET /BusOrder/BusLineDelete?Id=
    async removeLine(row) {
      try {
        await this.$confirm(
          `确定删除路线「${row.LineName}」吗？删除后不可恢复`,
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
          url: '/BusOrder/BusLineDelete',
          method: 'get',
          params: { Id: row.Id },
        })
        Message.success('删除成功')
        this.loadLines()
        this.loadAllLines()
      } catch (e) {
        // 拦截器已提示
      }
    },

    // 班车模板列表单选：点击行同步选中 radio
    handleTplRowClick(row) {
      if (row && row.Id) this.selectedTplId = row.Id
    },

    // 复制班车模板：GET /BusOrder/CopyBusLineTemplate?Id=
    async copyTpl() {
      if (!this.selectedTplId) {
        Message.warning('请先选中一条班车模板')
        return
      }
      const row = this.filteredTemplates.find(
        (i) => i.Id === this.selectedTplId,
      )
      try {
        await this.$confirm(
          `确定复制班车模板（${row ? row.LineId_Name || '该路线' : '该'} ${
            row ? row.StartTime || '' : ''
          } ~ ${row ? row.EndTime || '' : ''}）吗？`,
          '提示',
          {
            type: 'warning',
            confirmButtonText: '复制',
            cancelButtonText: '取消',
          },
        )
      } catch (e) {
        return // 取消
      }
      this.tplCopying = true
      try {
        await request({
          url: '/BusOrder/CopyBusLineTemplate',
          method: 'get',
          params: { Id: this.selectedTplId },
        })
        Message.success('复制成功')
        this.selectedTplId = null
        this.loadTemplates()
      } catch (e) {
        // 拦截器已提示
      } finally {
        this.tplCopying = false
      }
    },

    // 删除班车模板：GET /BusOrder/DeleteBusDepartureTemplate?Id=
    async removeTemplate(row) {
      try {
        await this.$confirm(
          `确定删除班车模板（${row.LineId_Name || '该路线'} ${
            row.StartTime || ''
          } ~ ${row.EndTime || ''}）吗？删除后不可恢复`,
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
          url: '/BusOrder/DeleteBusDepartureTemplate',
          method: 'get',
          params: { Id: row.Id },
        })
        Message.success('删除成功')
        this.loadTemplates()
      } catch (e) {
        // 拦截器已提示
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
    // 模板下拉数据：路线 / 司机 / 车辆，全部直接取后台接口返回
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
    // 选路线时带出该路线所属组织（路线只取 GetBusLineList 的返回）
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

    // ==================== 车辆管理 ====================
    // 首次进入 tab：拉列表 + 字典 + 司机下拉
    initVehicleTab() {
      this.loadVehicles()
      this.loadVehicleDicts()
      if (!this.tplDrivers.length) this.loadTplOptions()
    },
    // 车辆类型 / 车辆状态字典（只拉一次）
    async loadVehicleDicts() {
      if (this.vehicleDictLoaded) return
      this.vehicleDictLoaded = true
      const [typeRes, statusRes] = await Promise.all([
        request({
          url: '/BusOrder/GetBusVehicleTypeList',
          method: 'post',
          data: {},
          silent: true,
        }).catch(() => null),
        request({
          url: '/BusOrder/BusCarStatusList',
          method: 'post',
          data: {},
          silent: true,
        }).catch(() => null),
      ])
      this.vehicleTypeList = toList(typeRes)
      this.vehicleStatusList = toList(statusRes)
    },
    async loadVehicles() {
      this.vehicleLoading = true
      try {
        const res = await request({
          url: '/BusOrder/GetBusVehiclePageList',
          method: 'post',
          data: {
            VehicleNo: this.vehicleSearch.VehicleNo || null,
            CarStatus:
              this.vehicleSearch.CarStatus == null
                ? null
                : this.vehicleSearch.CarStatus,
            pageIndex: this.vehiclePage.pageIndex,
            pageSize: this.vehiclePage.pageSize,
          },
        })
        this.vehicleList = res.data || []
        this.vehicleTotal = res.count || 0
      } catch (e) {
        this.vehicleList = []
        this.vehicleTotal = 0
      } finally {
        this.vehicleLoading = false
      }
    },
    handleVehicleSearch() {
      this.vehiclePage.pageIndex = 1
      this.loadVehicles()
    },
    resetVehicleSearch() {
      this.vehicleSearch = { VehicleNo: '', CarStatus: null }
      this.handleVehicleSearch()
    },
    handleVehicleSizeChange(size) {
      this.vehiclePage.pageSize = size
      this.vehiclePage.pageIndex = 1
      this.loadVehicles()
    },
    handleVehiclePageChange(page) {
      this.vehiclePage.pageIndex = page
      this.loadVehicles()
    },
    // 类型 / 状态文案：优先行上自带的 *_Name，其次用字典映射
    vehicleTypeLabel(row) {
      if (row.VehicleType_Name) return row.VehicleType_Name
      const hit = this.vehicleTypeOptions.find(
        (item) => String(item.value) === String(row.VehicleType),
      )
      return hit ? hit.label : row.VehicleType == null ? '-' : row.VehicleType
    },
    vehicleStatusLabel(row) {
      if (row.CarStatus_Name) return row.CarStatus_Name
      const hit = this.vehicleStatusOptions.find(
        (item) => String(item.value) === String(row.CarStatus),
      )
      return hit ? hit.label : row.CarStatus == null ? '-' : row.CarStatus
    },
    // 新建 / 编辑车辆：编辑时先拉详情
    async openVehicleDialog(row) {
      await this.loadVehicleDicts()
      if (!this.tplDrivers.length) this.loadTplOptions()
      if (row && row.Id) {
        try {
          const res = await request({
            url: '/BusOrder/GetBusVehicleInfo',
            method: 'get',
            params: { Id: row.Id },
          })
          const detail = res.data || {}
          this.vehicleForm = Object.assign(emptyVehicle(), {
            Id: detail.Id,
            VehicleNo: detail.VehicleNo || '',
            VehicleType:
              detail.VehicleType == null ? null : Number(detail.VehicleType),
            SeatTotal:
              detail.SeatTotal == null ? null : Number(detail.SeatTotal),
            IsUse: detail.IsUse !== false,
            CarStatus:
              detail.CarStatus == null ? null : Number(detail.CarStatus),
            BuyDate: (detail.BuyDate || '').slice(0, 10),
            Remark: detail.Remark == null ? null : detail.Remark,
            DriverId: detail.DriverId || '',
          })
        } catch (e) {
          return
        }
      } else {
        this.vehicleForm = emptyVehicle()
      }
      this.vehicleDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.vehicleForm) this.$refs.vehicleForm.clearValidate()
      })
    },
    async saveVehicle() {
      this.$refs.vehicleForm.validate(async (valid) => {
        if (!valid) return
        this.vehicleSaving = true
        const payload = {
          VehicleNo: this.vehicleForm.VehicleNo,
          VehicleType: this.vehicleForm.VehicleType,
          SeatTotal: this.vehicleForm.SeatTotal,
          IsUse: this.vehicleForm.IsUse,
          CarStatus: this.vehicleForm.CarStatus,
          BuyDate: this.vehicleForm.BuyDate || null,
          Remark: this.vehicleForm.Remark || null,
          DriverId: this.vehicleForm.DriverId || null,
        }
        try {
          if (this.vehicleForm.Id) {
            await request({
              url: '/BusOrder/UpdateBusVehicle',
              method: 'post',
              data: Object.assign(payload, { Id: this.vehicleForm.Id }),
            })
          } else {
            await request({
              url: '/BusOrder/CreateBusVehicle',
              method: 'post',
              data: payload,
            })
          }
          Message.success('保存成功')
          this.vehicleDialogVisible = false
          this.loadVehicles()
        } catch (e) {
          // 拦截器已提示
        } finally {
          this.vehicleSaving = false
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

  /* 站点列表搜索框 */
  .site-search {
    width: 200px;
    margin-right: 8px;
  }
  .map-wrap {
    position: relative;
  }
  /* 站点管理：地图与右侧编辑表单等高 */
  .site-row {
    align-items: stretch;

    .panel {
      width: 100%;
      height: 100%;
      margin-bottom: 0;
      box-sizing: border-box;
    }
    .site-map-panel,
    .site-form-panel {
      display: flex;
      flex-direction: column;
    }
    .site-map-panel .map-wrap {
      flex: 1;
      min-height: 0;
    }
    .site-map-panel .map-box {
      height: 100%;
      min-height: 420px;
    }
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
    align-items: center;
    width: 100%;

    > * {
      flex: 1;
      min-width: 0;
    }
    > .el-switch {
      flex: 0 0 auto;
    }
    > * + * {
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

  // 站点图片上传区
  .site-img-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .site-img-item,
  .site-img-add {
    position: relative;
    width: 78px;
    height: 78px;
    border: 1px dashed #d9d9d9;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    background: #fafafa;
    transition: border-color 0.2s;
  }
  .site-img-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .site-img-del {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 18px;
    height: 18px;
    line-height: 18px;
    text-align: center;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    border-radius: 50%;
    font-size: 12px;
    cursor: pointer;
    z-index: 2;
  }
  .site-img-add {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #8c939d;
    border-style: dashed;
  }
  .site-img-add:hover {
    border-color: #409eff;
    color: #409eff;
  }
  .site-img-add i {
    font-size: 24px;
  }
  .site-img-add__text {
    font-size: 12px;
    margin-top: 4px;
  }
  .site-img-uploading {
    margin-top: 6px;
    font-size: 12px;
    color: #409eff;
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
  // 路线列表单选框：隐藏 radio 文字，只留圆圈居中
  .line-radio {
    margin: 0;
    ::v-deep .el-radio__label {
      display: none;
    }
  }
}
</style>
