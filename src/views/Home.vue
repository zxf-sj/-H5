<template>
  <div class="home">
    <div class="card">
      <div class="card-head">
        <span class="card-head__title">巴士订单</span>
        <div>
          <el-button
            type="primary"
            size="mini"
            plain
            @click="$router.push('/bus-order')"
            >巴士下单</el-button
          >
          <el-button
            type="primary"
            size="mini"
            plain
            @click="$router.push('/bus-admin')"
            >巴士管理</el-button
          >
          <el-button
            type="primary"
            size="mini"
            plain
            @click="$router.push('/bus-operations')"
            >运营时刻</el-button
          >
        </div>
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
        <el-form-item label="巴士路线" size="mini">
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
        <el-table-column prop="Vehicle_Name" label="车牌号" align="center" />
        <el-table-column prop="AdultNum" label="实到人数" align="center" />
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
        <el-table-column prop="PayType_Name" label="支付方式" align="center" />
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
        <el-table-column fixed="right" label="操作" width="220" align="center">
          <template slot-scope="scope">
            <el-button @click="handleDetail(scope.row)" type="text" size="small"
              >查看</el-button
            >
            <el-button @click="handleEdit(scope.row)" type="text" size="small"
              >修改</el-button
            >
            <el-button
              @click="handleCancelRefund(scope.row)"
              v-if="scope.row.PayStatus === 1"
              type="text"
              size="small"
              >取消退款</el-button
            >
            <el-button
              @click="handleTsRefund(scope.row)"
              v-if="scope.row.PayStatus === 1"
              type="text"
              size="small"
              >特殊退款</el-button
            >
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
              <el-descriptions-item label="实到人数"
                >{{ detail.AdultNum || 0 }} 人</el-descriptions-item
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
              <el-descriptions-item label="巴士路线">{{
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
                >¥
                {{ formatMoney(detail.DiscountAmount) }}</el-descriptions-item
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

    <!-- 修改订单弹窗 -->
    <el-dialog
      title="修改订单"
      :visible.sync="editVisible"
      width="860px"
      top="6vh"
      :close-on-click-modal="false"
      @closed="handleEditClosed"
    >
      <div v-loading="editLoading" class="edit-body">
        <el-form :model="editForm" label-width="90px" size="mini">
          <div class="detail-section">
            <div class="detail-section__title">基本信息</div>
            <el-row :gutter="8">
              <el-col :span="8">
                <el-form-item label="巴士路线">
                  <el-select
                    v-model="editForm.LineId"
                    filterable
                    placeholder="选择路线"
                    class="full"
                    disabled
                    @change="onEditLineChange"
                  >
                    <el-option
                      v-for="item in busLineList"
                      :key="item.Id"
                      :label="item.LineName"
                      :value="item.Id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="日期">
                  <el-radio-group
                    v-model="editDateType"
                    size="mini"
                    @change="onEditDateTypeChange"
                  >
                    <el-radio-button label="today">今天</el-radio-button>
                    <el-radio-button label="tomorrow">明天</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="班次">
                  <el-select
                    v-model="editForm.ScheduleId"
                    filterable
                    :placeholder="'选择班次（' + editDate + '）'"
                    class="full"
                    :loading="scheduleLoading"
                    @change="onEditScheduleChange"
                  >
                    <el-option
                      v-for="item in scheduleList"
                      :key="item.Id"
                      :label="
                        (item.DepartureTime || '') +
                        ' ' +
                        (item.StatingLocation_Name || '') +
                        (item.EmptySeat > 0
                          ? '（余' + item.EmptySeat + '座）'
                          : '（无余票）')
                      "
                      :value="item.Id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="8">
              <el-col :span="8">
                <el-form-item label="出发地点">
                  <el-select
                    v-model="editForm.StatingLocation"
                    filterable
                    placeholder="选择站点"
                    class="full"
                    disabled
                    :loading="editSiteLoading"
                  >
                    <el-option
                      v-for="item in editBoardSites"
                      :key="item.LocationId"
                      :label="item.LocationName"
                      :value="item.LocationId"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="到达地点">
                  <el-select
                    v-model="editForm.EndLocation"
                    filterable
                    placeholder="选择站点"
                    class="full"
                    disabled
                    :loading="editSiteLoading"
                  >
                    <el-option
                      v-for="item in editAlightSites"
                      :key="item.LocationId"
                      :label="item.LocationName"
                      :value="item.LocationId"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="乘客手机号">
                  <el-input
                    v-model="editForm.PassengerPhone"
                    maxlength="11"
                    placeholder="乘客手机号"
                    disabled
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="8">
              <el-col :span="8">
                <el-form-item label="订单状态">
                  <el-select
                    v-model="editForm.OrderStatus"
                    placeholder="请选择"
                    class="full"
                    disabled
                  >
                    <el-option
                      v-for="item in busOrderStateList"
                      :key="item.Value"
                      :label="item.Text"
                      :value="item.Value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="付款状态">
                  <el-select
                    v-model="editForm.PayStatus"
                    placeholder="请选择"
                    class="full"
                    disabled
                  >
                    <el-option
                      v-for="item in busPayStatusList"
                      :key="item.Value"
                      :label="item.Text"
                      :value="item.Value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="支付方式">
                  <el-select
                    v-model="editForm.PayType"
                    placeholder="请选择"
                    class="full"
                    disabled
                  >
                    <el-option
                      v-for="item in payTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div class="detail-section">
            <div class="detail-section__title">金额与人数</div>
            <el-row :gutter="8">
              <el-col :span="6">
                <el-form-item label="票价">
                  <el-input-number
                    v-model="editForm.TicketPrice"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    class="full"
                    disabled
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="订单金额">
                  <el-input-number
                    v-model="editForm.TotalAmount"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    class="full"
                    disabled
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="优惠金额">
                  <el-input-number
                    v-model="editForm.DiscountAmount"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    class="full"
                    disabled
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="实付金额">
                  <el-input-number
                    v-model="editForm.PayAmount"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    class="full"
                    disabled
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="8">
              <el-col :span="8">
                <el-form-item label="成人数">
                  <el-input-number
                    v-model="editForm.AdultNum"
                    :min="0"
                    :controls="false"
                    class="full"
                    disabled
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="儿童数">
                  <el-input-number
                    v-model="editForm.Children"
                    :min="0"
                    :controls="false"
                    class="full"
                    disabled
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="实到人数">
                  <el-input :value="editTicketNum" disabled />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div class="detail-section">
            <div class="detail-section__title">
              乘车人（{{ editPassengers.length }} 人）
              <el-button
                type="text"
                size="mini"
                class="pax-add"
                disabled
                @click="addEditPassenger"
                >+ 添加乘车人</el-button
              >
            </div>
            <div
              v-for="(item, index) in editPassengers"
              :key="index"
              class="pax-row"
            >
              <el-input
                v-model="item.Name"
                size="mini"
                placeholder="姓名"
                class="pax__name"
                disabled
              />
              <el-input
                v-model="item.Phone"
                size="mini"
                maxlength="11"
                placeholder="手机号"
                class="pax__phone"
                disabled
              />
              <el-input
                v-model="item.IdCard"
                size="mini"
                placeholder="身份证号"
                class="pax__idcard"
                disabled
              />
              <el-button
                v-if="editPassengers.length > 1"
                type="text"
                size="mini"
                disabled
                @click="removeEditPassenger(index)"
                >删除</el-button
              >
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section__title">其他</div>
            <el-row :gutter="8">
              <el-col :span="12">
                <el-form-item label="备注">
                  <el-input
                    v-model="editForm.Remark"
                    placeholder="备注（选填）"
                    disabled
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>
      <span slot="footer">
        <el-button size="small" @click="editVisible = false">取消</el-button>
        <el-button
          type="primary"
          size="small"
          :loading="editSubmitting"
          @click="submitEdit"
          >保存修改</el-button
        >
      </span>
    </el-dialog>

    <!-- 取消订单并退款 -->
    <el-dialog
      title="取消订单并退款"
      :visible.sync="cancelVisible"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form :model="cancelForm" label-width="90px" size="mini">
        <el-form-item label="订单号">
          <el-input :value="cancelForm.OrderNo" disabled />
        </el-form-item>
        <el-form-item label="实付金额">
          <el-input
            :value="'¥ ' + formatMoney(cancelForm.PayAmount)"
            disabled
          />
        </el-form-item>
        <el-form-item label="退款方式">
          <el-radio-group v-model="cancelForm.RefundType">
            <el-radio :label="false">扣30%（退款70%）</el-radio>
            <el-radio :label="true">全额退款</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="取消原因">
          <el-input
            v-model="cancelForm.tag"
            type="textarea"
            :rows="3"
            placeholder="请输入取消原因"
          />
        </el-form-item>
        <div class="refund-preview" v-if="cancelForm.RefundType === false">
          预计退款金额：<span class="amount">¥ {{ cancelRefundPreview }}</span
          >（实付 70%）
        </div>
        <div class="refund-preview" v-else>
          预计退款金额：<span class="amount">¥ {{ cancelRefundPreview }}</span
          >（全额）
        </div>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="cancelVisible = false">取消</el-button>
        <el-button
          type="primary"
          size="small"
          :loading="cancelSubmitting"
          @click="submitCancel"
          >确认取消并退款</el-button
        >
      </span>
    </el-dialog>

    <!-- 特殊退款 -->
    <el-dialog
      title="特殊退款"
      :visible.sync="tsRefundVisible"
      width="460px"
      :close-on-click-modal="false"
    >
      <el-form :model="tsRefundForm" label-width="90px" size="mini">
        <el-form-item label="订单号">
          <el-input :value="tsRefundForm.OrderNo" disabled />
        </el-form-item>
        <el-form-item label="实付金额">
          <el-input
            :value="'¥ ' + formatMoney(tsRefundForm.PayAmount)"
            disabled
          />
        </el-form-item>
        <el-form-item label="退款金额">
          <el-input-number
            v-model="tsRefundForm.RefundAmount"
            :min="0.01"
            :max="tsRefundForm.PayAmount || 99999"
            :precision="2"
            :step="1"
            :controls="false"
            class="full"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="tsRefundVisible = false"
          >取消</el-button
        >
        <el-button
          type="primary"
          size="small"
          :loading="tsRefundSubmitting"
          @click="submitTsRefund"
          >确认退款</el-button
        >
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
      busLineList: [], //巴士路线
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
      // —— 修改订单 ——
      editVisible: false,
      editLoading: false,
      editSubmitting: false,
      editForm: {
        Id: '',
        LineId: null,
        ScheduleId: null,
        PassengerPhone: '',
        TotalAmount: 0,
        DiscountAmount: 0,
        PayAmount: 0,
        TicketPrice: 0,
        PayStatus: 0,
        PayType: 1,
        CancelReason: '',
        Remark: '',
        OrderStatus: 0,
        StatingLocation: null,
        EndLocation: null,
        AdultNum: 0,
        Children: 0,
        PersonNum: 0,
      },
      editPassengers: [{ Name: '', Phone: '', IdCard: '' }],
      editDeparture: '', // 订单原出发时间，兜底匹配班次用
      editOrderPast: false, // 订单出发日期是否早于今天（过去了就不回显原班次/站点）
      editDateType: 'today', // 班次/站点查询日期：today=今天（默认） tomorrow=明天
      scheduleList: [], // 班次下拉
      scheduleLoading: false,
      allSites: [], // 全量站点，编辑回填反查用
      editBoardSites: [], // 修改订单：出发地点下拉（GetBusLineSiteInfo 按路线返回）
      editAlightSites: [], // 修改订单：到达地点下拉
      editSiteLoading: false,
      payTypeOptions: [
        { value: 1, label: '微信支付' },
        { value: 2, label: '云闪付' },
      ],
      // —— 取消订单并退款 ——
      cancelVisible: false,
      cancelSubmitting: false,
      cancelForm: {
        Id: '',
        OrderNo: '',
        PayAmount: 0,
        RefundType: false,
        tag: '',
      },
      // —— 特殊退款 ——
      tsRefundVisible: false,
      tsRefundSubmitting: false,
      tsRefundForm: {
        Id: '',
        OrderNo: '',
        PayAmount: 0,
        RefundAmount: 0,
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
    // 编辑表单：实到人数 = 成人数 + 儿童数
    editTicketNum() {
      return (
        (Number(this.editForm.AdultNum) || 0) +
        (Number(this.editForm.Children) || 0)
      )
    },
    // 班次/站点查询日期：默认今天，选「明天」按钮则 +1 天
    editDate() {
      const base = this.formatDay(new Date())
      if (this.editDateType !== 'tomorrow') return base
      const d = new Date(String(base).replace(/-/g, '/'))
      if (isNaN(d.getTime())) return base
      d.setDate(d.getDate() + 1)
      return this.formatDay(d)
    },
    // 当前选中的班次对象（取站点接口用的出发时间）
    editSchedule() {
      return (
        this.scheduleList.find(
          (item) => item.Id === this.editForm.ScheduleId,
        ) || null
      )
    },
    // 取消退款预计金额：RefundType=false 扣30%=退70%；true 全退
    cancelRefundPreview() {
      const pay = Number(this.cancelForm.PayAmount) || 0
      const amt = this.cancelForm.RefundType ? pay : pay * 0.7
      return amt.toFixed(2)
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
    //获取巴士路线
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

    /* ===== 修改订单 ===== */
    // 打开修改弹窗：拉详情回填，并按需加载站点/班次
    async handleEdit(row) {
      if (!row || !row.Id) return
      this.editVisible = true
      this.editLoading = true
      if (!this.allSites.length) this.loadAllSites()
      let detail = null
      try {
        const data = await request({
          url: '/BusOrder/GetBusOrderInfo',
          method: 'get',
          params: { Id: row.Id },
        })
        detail = data.data || null
      } catch (e) {
        // 详情拉取失败时退回用行数据回填
        detail = null
      }
      this.prefillEdit(detail, row)
      this.editLoading = false
      if (this.editForm.LineId != null) {
        this.loadEditSchedules()
        // 出发/到达地点下拉：按订单路线拉站点详情
        this.loadEditSites()
      }
    },
    // 详情/行数据回填编辑表单：优先取原始字段，缺失时按 *_Name 反查下拉选项
    prefillEdit(d, row) {
      console.log('prefillEdit', d, row)
      const src = d || row || {}
      const num = (v) =>
        v === null || v === undefined || v === '' ? 0 : Number(v) || 0
      this.editForm = {
        Id: src.Id || row.Id,
        LineId:
          src.LineId != null
            ? src.LineId
            : this.matchId(this.busLineList, src.Line_Name, 'Id', 'LineName'),
        ScheduleId: src.ScheduleId != null ? src.ScheduleId : null,
        PassengerPhone: src.PassengerPhone || '',
        TotalAmount: num(src.TotalAmount),
        DiscountAmount: num(src.DiscountAmount),
        PayAmount: num(src.PayAmount),
        TicketPrice: num(src.TicketPrice),
        PayStatus:
          src.PayStatus != null
            ? src.PayStatus
            : this.matchId(
                this.busPayStatusList,
                src.PayStatus_Name,
                'Value',
                'Text',
              ),
        PayType: src.PayType != null ? Number(src.PayType) : 1,
        CancelReason: src.CancelReason || '',
        Remark: src.Remark || src.Note || '',
        OrderStatus:
          src.OrderStatus != null
            ? src.OrderStatus
            : this.matchId(
                this.busOrderStateList,
                src.OrderStatus_Name,
                'Value',
                'Text',
              ),
        StatingLocation:
          src.StatingLocation != null
            ? src.StatingLocation
            : this.matchId(
                this.allSites,
                src.StatingLocation_Name,
                'Id',
                'LocationName',
              ),
        EndLocation:
          src.EndLocation != null
            ? src.EndLocation
            : this.matchId(
                this.allSites,
                src.EndLocation_Name,
                'Id',
                'LocationName',
              ),
        AdultNum: num(src.AdultNum),
        Children: num(src.Children),
        PersonNum: num(src.PersonNum),
      }
      this.editDeparture = src.DepartureTime_DateTime || src.DepartureTime || ''
      // 班次/站点默认请求今天的
      this.editDateType = 'today'
      // 订单出发日期早于今天：不回显原班次与上下车站，只请求今天的班次
      const orderDay = this.formatDay(this.editDeparture)
      this.editOrderPast = !!orderDay && orderDay < this.formatDay(new Date())
      if (this.editOrderPast) {
        this.editForm.ScheduleId = null
        this.editForm.StatingLocation = null
        this.editForm.EndLocation = null
      }
      // 乘车人：优先详情 Userlist，其次 PersonalIds 字符串（姓名|手机号|身份证）
      const ul = (d && d.Userlist) || []
      if (ul.length) {
        this.editPassengers = ul.map((u) => ({
          Name: u.Name || '',
          Phone: u.Code || u.Phone || '',
          IdCard: u.IDCard || '',
        }))
      } else {
        const ids = src.PersonalIds || ''
        this.editPassengers = ids
          ? ids
              .split(',')
              .filter(Boolean)
              .map((s) => {
                const parts = s.split('|')
                return {
                  Name: parts[0] || '',
                  Phone: parts[1] || '',
                  IdCard: parts[2] || '',
                }
              })
          : [{ Name: '', Phone: '', IdCard: '' }]
      }
    },
    // 按 Name 从下拉数据里反查 Id/Value，用于详情缺失原始字段时兜底
    matchId(list, name, idKey, nameKey) {
      if (!name || !Array.isArray(list)) return null
      const hit = list.find((item) => item[nameKey] === name)
      return hit ? hit[idKey] : null
    },
    // 全量站点：出发/到达地点下拉共用（同 BusAdmin）
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
    // 按日期（今天默认 / 明天）拉取所选路线的班次
    async loadEditSchedules() {
      if (this.editForm.LineId == null) return
      this.scheduleLoading = true
      try {
        const data = await request({
          url: '/BusOrder/GetBusLineScheduleList',
          method: 'get',
          params: {
            lineId: this.editForm.LineId,
            today: this.editDate,
          },
        })
        this.scheduleList = data.data || []
        // 「今天」且详情没回填到 ScheduleId 时，按出发时间兜底匹配（过去的订单不匹配）
        if (
          this.editDateType === 'today' &&
          !this.editOrderPast &&
          this.editForm.ScheduleId == null &&
          this.editDeparture
        ) {
          const hit = this.scheduleList.find(
            (item) =>
              String(item.DepartureTime || '') === String(this.editDeparture),
          )
          if (hit) {
            this.editForm.ScheduleId = hit.Id
            // 兜底匹配到班次后，用班次 Id 拉出发地/目的地
            this.loadEditSites()
          }
        }
      } catch (e) {
        this.scheduleList = []
      } finally {
        this.scheduleLoading = false
      }
    },
    // 切换今天/明天：清空已选班次与出发地/目的地，只请求所选日期的班次
    onEditDateTypeChange() {
      this.editForm.ScheduleId = null
      this.editForm.StatingLocation = null
      this.editForm.EndLocation = null
      this.editBoardSites = []
      this.editAlightSites = []
      this.loadEditSchedules()
    },
    // 选中班次后：拿班次 Id 请求该班次当天的出发地/目的地列表
    onEditScheduleChange() {
      this.editForm.StatingLocation = null
      this.editForm.EndLocation = null
      this.loadEditSites()
    },
    // 编辑弹窗换路线：清空班次与已选站点并重新拉取
    onEditLineChange() {
      this.editForm.ScheduleId = null
      this.scheduleList = []
      // 路线变了，站点集合也变了，清掉已选上下车站
      this.editForm.StatingLocation = null
      this.editForm.EndLocation = null
      this.editBoardSites = []
      this.editAlightSites = []
      this.loadEditSchedules()
    },
    // 出发/到达地点下拉：POST /api/BusMobile/GetBusLineSiteTimeInfo（巴士路线站点详情）
    // 返回 StartSiteList = 出发地点，EndSiteList = 到达地点；按所选班次 Id 请求
    async loadEditSites() {
      if (this.editForm.LineId == null || this.editForm.ScheduleId == null) {
        this.editBoardSites = []
        this.editAlightSites = []
        return
      }
      this.editSiteLoading = true
      try {
        const res = await request({
          url: '/api/BusMobile/GetBusLineSiteTimeInfo',
          method: 'post',
          data: {
            ScheduleId: this.editForm.ScheduleId,
            LineId: this.editForm.LineId,
            DepartureTime:
              (this.editSchedule && this.editSchedule.DepartureTime) ||
              this.editDate + ' 00:00:00',
          },
        })
        const d = res.data || {}
        console.log('loadEditSites', d)
        this.editBoardSites = d.StartSiteList || []
        this.editAlightSites = d.EndSiteList || []
      } catch (e) {
        this.editBoardSites = []
        this.editAlightSites = []
      } finally {
        this.editSiteLoading = false
      }
    },
    // 取 yyyy-MM-dd（用于按日期查询班次），复用 formatDate 的多格式兼容
    formatDay(val) {
      if (val === null || val === undefined || val === '') return ''
      const s = this.formatDate(val)
      return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : ''
    },
    addEditPassenger() {
      this.editPassengers.push({ Name: '', Phone: '', IdCard: '' })
    },
    removeEditPassenger(index) {
      if (this.editPassengers.length <= 1) return
      this.editPassengers.splice(index, 1)
    },
    // 弹窗关闭后清空编辑状态
    handleEditClosed() {
      this.editForm = {
        Id: '',
        LineId: null,
        ScheduleId: null,
        PassengerPhone: '',
        TotalAmount: 0,
        DiscountAmount: 0,
        PayAmount: 0,
        TicketPrice: 0,
        PayStatus: 0,
        PayType: 1,
        CancelReason: '',
        Remark: '',
        OrderStatus: 0,
        StatingLocation: null,
        EndLocation: null,
        AdultNum: 0,
        Children: 0,
        PersonNum: 0,
      }
      this.editPassengers = [{ Name: '', Phone: '', IdCard: '' }]
      this.editDeparture = ''
      this.editOrderPast = false
      this.editDateType = 'today'
      this.scheduleList = []
      this.editBoardSites = []
      this.editAlightSites = []
    },
    // 保存修改：POST /BusOrder/UpdateBusOrderInfo
    async submitEdit() {
      const f = this.editForm
      if (f.LineId == null) {
        this.$message.warning('请选择巴士路线')
        return
      }
      if (f.ScheduleId == null) {
        this.$message.warning('请选择班次')
        return
      }
      if (f.StatingLocation == null || f.EndLocation == null) {
        this.$message.warning('请选择出发/到达地点')
        return
      }
      if (!/^1\d{10}$/.test(String(f.PassengerPhone || '').trim())) {
        this.$message.warning('请填写正确的乘客手机号')
        return
      }
      const phoneRe = /^1[3-9]\d{9}$/
      for (let i = 0; i < this.editPassengers.length; i++) {
        const p = this.editPassengers[i]
        if (!String(p.Name || '').trim()) {
          this.$message.warning(`第 ${i + 1} 位乘车人还没填姓名`)
          return
        }
        if (!phoneRe.test(String(p.Phone || '').trim())) {
          this.$message.warning(`第 ${i + 1} 位乘车人手机号不正确`)
          return
        }
      }
      const personalIds = this.editPassengers
        .map(
          (p) =>
            `${String(p.Name).trim()}|${String(p.Phone).trim()}|${String(
              p.IdCard || '',
            ).trim()}`,
        )
        .join(',')
      this.editSubmitting = true
      try {
        await request({
          url: '/BusOrder/UpdateBusOrderInfo',
          method: 'post',
          data: {
            LineId: f.LineId,
            ScheduleId: f.ScheduleId,
            PassengerPhone: String(f.PassengerPhone).trim(),
            TotalAmount: Number(f.TotalAmount) || 0,
            DiscountAmount: Number(f.DiscountAmount) || 0,
            PayAmount: Number(f.PayAmount) || 0,
            TicketPrice: Number(f.TicketPrice) || 0,
            PayStatus: f.PayStatus == null ? 0 : f.PayStatus,
            PayType: f.PayType == null ? 1 : f.PayType,
            CancelReason: f.CancelReason || '',
            Remark: f.Remark || '',
            OrderStatus: f.OrderStatus == null ? 0 : f.OrderStatus,
            StatingLocation: f.StatingLocation,
            EndLocation: f.EndLocation,
            TicketNum: this.editTicketNum,
            AdultNum: Number(f.AdultNum) || 0,
            Children: Number(f.Children) || 0,
            PersonalIds: personalIds,
            PersonNum: Number(f.PersonNum) || 0,
            Id: f.Id,
          },
        })
        this.$message.success('订单修改成功')
        this.editVisible = false
        this.getDataList()
      } catch (e) {
        // 错误提示由 request 拦截器统一弹出
      } finally {
        this.editSubmitting = false
      }
    },

    /* ===== 取消订单并退款：/BusOrder/CancelOrder（GET） ===== */
    handleCancelRefund(row) {
      if (!row || !row.Id) return
      this.cancelForm = {
        Id: row.Id,
        OrderNo: row.OrderNo || '-',
        PayAmount: Number(row.PayAmount) || 0,
        RefundType: false,
        tag: '',
      }
      this.cancelVisible = true
    },
    submitCancel() {
      const f = this.cancelForm
      if (!f.Id) return
      if (!String(f.tag || '').trim()) {
        this.$message.warning('请填写取消原因')
        return
      }
      const pay = Number(f.PayAmount) || 0
      if (pay <= 0) {
        this.$message.warning('该订单实付金额为 0，无法退款')
        return
      }
      this.cancelSubmitting = true
      request({
        url: '/BusOrder/CancelOrder',
        method: 'get',
        params: {
          Id: f.Id,
          tag: String(f.tag).trim(),
          RefundType: f.RefundType,
        },
      })
        .then(() => {
          this.$message.success('订单已取消，退款处理中')
          this.cancelVisible = false
          this.getDataList()
        })
        .catch(() => {
          // 错误提示由 request 拦截器统一弹出
        })
        .finally(() => {
          this.cancelSubmitting = false
        })
    },

    /* ===== 特殊退款：/BusOrder/TsRefund（GET） ===== */
    handleTsRefund(row) {
      if (!row || !row.Id) return
      const pay = Number(row.PayAmount) || 0
      this.tsRefundForm = {
        Id: row.Id,
        OrderNo: row.OrderNo || '-',
        PayAmount: pay,
        RefundAmount: pay,
      }
      this.tsRefundVisible = true
    },
    submitTsRefund() {
      const f = this.tsRefundForm
      if (!f.Id) return
      const amount = Number(f.RefundAmount)
      const pay = Number(f.PayAmount) || 0
      if (!(amount > 0)) {
        this.$message.warning('退款金额必须大于 0')
        return
      }
      if (amount > pay) {
        this.$message.warning('退款金额不能超过实付金额 ¥' + pay.toFixed(2))
        return
      }
      this.tsRefundSubmitting = true
      request({
        url: '/BusOrder/TsRefund',
        method: 'get',
        params: {
          Id: f.Id,
          RefundAmount: amount,
        },
      })
        .then(() => {
          this.$message.success('特殊退款提交成功')
          this.tsRefundVisible = false
          this.getDataList()
        })
        .catch(() => {
          // 错误提示由 request 拦截器统一弹出
        })
        .finally(() => {
          this.tsRefundSubmitting = false
        })
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

/* —— 修改订单弹窗 —— */
.edit-body {
  max-height: 68vh;
  overflow-y: auto;
  padding-right: 6px;
}
.full {
  width: 100%;
}
.edit-day-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}
.pax-add {
  margin-left: 10px;
}
.pax-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  .pax__name {
    width: 160px;
  }
  .pax__phone {
    width: 180px;
  }
  .pax__idcard {
    flex: 1;
  }
}
.refund-preview {
  padding: 8px 10px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 4px;
  font-size: 13px;
  color: #613400;
  .amount {
    font-weight: 600;
    color: #f5222d;
    margin-left: 4px;
  }
}
</style>
