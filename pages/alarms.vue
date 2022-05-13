<template>
  <div>
    <!-- NEW ALARM FORM -->
    <div class="row">
      <div class="col-sm-12">
        <card v-if="$store.state.devices.length > 0">
          <div slot="header">
            <h4 class="card-title">
              Create new Alarm Rule {{ selectedWidgetIndex }}
            </h4>
          </div>

          <div class="row">
            <div class="col-3">
              <el-select
                required
                class="select-success"
                placeholder="Variable"
                v-model="selectedWidgetIndex"
                style="margin-top: 25px"
              >
                <el-option
                  v-for="(widget, index) in $store.state.selectedDevice.template
                    .widgets"
                  :key="index"
                  class="text-dark"
                  :value="index"
                  :label="widget.variableFullName"
                ></el-option>
              </el-select>
            </div>

            <div class="col-3">
              <el-select
                required
                class="select-warning"
                placeholder="Condition"
                v-model="newRule.condition"
                style="margin-top: 25px"
              >
                <el-option class="text-dark" value="=" label="="></el-option>
                <el-option class="text-dark" value=">" label=">"></el-option>
                <el-option class="text-dark" value=">=" label=">="></el-option>
                <el-option class="text-dark" value="<" label="<"></el-option>
                <el-option class="text-dark" value="<=" label="<="></el-option>
                <el-option class="text-dark" value="!=" label="!="></el-option>
              </el-select>
            </div>

            <div class="col-3">
              <base-input
                label="Value"
                v-model="newRule.value"
                type="number"
              ></base-input>
            </div>

            <div class="col-3">
              <base-input
                label="Trigger Time (minutes)"
                v-model="newRule.triggerTime"
                type="number"
              ></base-input>
            </div>
          </div>

          <br /><br />

          <div class="row pull-right">
            <div class="col-12">
              <base-button
                @click="createNewRule()"
                native-type="submit"
                type="primary"
                class="mb-3"
                size="lg"
                :disabled="$store.state.devices.length == 0"
              >
                Add Alarm Rule
              </base-button>
            </div>
          </div>
        </card>
        <card v-else> You need to select a device to create an Alarm </card>
      </div>
    </div>
    <!-- ALARMS TABLE -->
    <div class="row" v-if="$store.state.devices.length > 0">
      <div class="col-sm-12">
        <card>
          <div slot="header">
            <h4 class="card-title">Alarm Rules</h4>
          </div>

          <el-table
            v-if="$store.state.selectedDevice.alarmRules.length > 0"
            :data="$store.state.selectedDevice.alarmRules"
          >
            <el-table-column min-width="50" label="#" align="center">
              <div class="photo" slot-scope="{ row, $index }">
                {{ $index + 1 }}
              </div>
            </el-table-column>

            <el-table-column
              prop="variableFullName"
              label="Var Name"
            ></el-table-column>

            <el-table-column prop="variable" label="Variable"></el-table-column>

            <el-table-column
              prop="condition"
              label="Condition"
            ></el-table-column>

            <el-table-column prop="value" label="Value"></el-table-column>

            <el-table-column
              prop="triggerTime"
              label="Trigger Time"
            ></el-table-column>

            <el-table-column prop="counter" label="Matches"></el-table-column>

            <el-table-column header-align="right" align="right" label="Actions">
              <div
                slot-scope="{ row, $index }"
                class="text-right table-actions"
              >
                <el-tooltip content="Delete" effect="light" placement="top">
                  <base-button
                    @click="deleteDevice(row)"
                    type="danger"
                    icon
                    size="sm"
                    class="btn-link"
                  >
                    <i class="tim-icons icon-simple-remove"></i>
                  </base-button>
                </el-tooltip>

                <el-tooltip content="Rule Status" style="margin-left: 20px">
                  <i
                    class="fas fa-exclamation-triangle"
                    :class="{ 'text-warning': row.status }"
                  ></i>
                </el-tooltip>

                <!-- no ato row.status al v model porque al cambiar de status cambiaria directo sobre store lo que daría error en
                      cambio uso el value, al accionar el switch no cambiará el objeto, pero podré cambiar el valor en la función -->
                <el-tooltip
                  content="Change Rule Status"
                  style="margin-left: 5px"
                >
                  <base-switch
                    @click="updateStatusRule(row)"
                    :value="row.status"
                    type="primary"
                    on-text="ON"
                    off-text="OFF"
                    style="margin-top: 10px"
                  ></base-switch>
                </el-tooltip>
              </div>
            </el-table-column>
          </el-table>

          <h4 v-else class="card-title">No Alarm Rules</h4>
        </card>
      </div>
    </div>
  </div>
</template>

<script>
import { Select, Option } from "element-ui";
import { Table, TableColumn } from "element-ui";

export default {
  components: {
    [Select.name]: Select,
    [Option.name]: Option,
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
  },
  data() {
    return {
      alarmRules: [],
      selectedWidgetIndex: null,
      newRule: {
        dId: null,
        deviceName: null,
        status: true,
        variableFullName: null,
        variable: null,
        value: null,
        condition: null,
        triggerTime: null,
      },
    };
  },
  methods: {
    async createNewRule() {
      if (this.selectedWidgetIndex == null) {
        this.$notify({
          type: "warning",
          icon: "tim-icons icon-alert-circle-exc",
          message: " Variable must be selected",
        });
        return;
      }

      if (this.newRule.condition == null) {
        this.$notify({
          type: "warning",
          icon: "tim-icons icon-alert-circle-exc",
          message: " Condition must be selected",
        });
        return;
      }

      if (this.newRule.value == null) {
        this.$notify({
          type: "warning",
          icon: "tim-icons icon-alert-circle-exc",
          message: " Value is empty",
        });
        return;
      }

      if (this.newRule.triggerTime == null) {
        this.$notify({
          type: "warning",
          icon: "tim-icons icon-alert-circle-exc",
          message: " Trigger Time is empty",
        });
        return;
      }
      try {
        this.newRule.dId = this.$store.state.selectedDevice.dId;
        this.newRule.deviceName = this.$store.state.selectedDevice.name;
        this.newRule.variableFullName =
          this.$store.state.selectedDevice.template.widgets[
            this.selectedWidgetIndex
          ].variableFullName;
        this.newRule.variable =
          this.$store.state.selectedDevice.template.widgets[
            this.selectedWidgetIndex
          ].variable;
        const axiosHeader = {
          headers: {
            "Content-Type": "application/json",
            token: this.$store.state.auth.token,
          },
        };

        var toSend = {
          newRule: this.newRule,
        };
        const res = await this.$axios.post("/alarm-rule", toSend, axiosHeader);
        if (res.data.status) {
          this.newRule.variable = null;
          this.newRule.condition = null;
          this.newRule.value = null;
          this.newRule.triggerTime = null;
          this.selectedWidgetIndex = null;

          this.$notify({
            type: "success",
            icon: "tim-icons icon-check-2",
            message: "Success! Alarm Rule was added",
          });

          this.$store.dispatch("getDevices");
        }
      } catch (error) {
        this.$notify({
          type: "warning",
          icon: "tim-icons icon-alert-circle-exc",
          message: " Error creating new rule",
        });
      }
    },
    async deleteDevice(rule) {
      try {
        const axiosHeader = {
          headers: {
            "Content-Type": "application/json",
            token: this.$store.state.auth.token,
          },
          params: {
            emqxRuleId: rule.emqxRuleId,
          },
        };
        const res = await this.$axios.delete("/alarm-rule", axiosHeader);
        if (res.data.status) {
          this.$notify({
            type: "success",
            icon: "tim-icons icon-check-2",
            message: "Success! Alarm Rule was deleted",
          });
          this.$store.dispatch("getDevices");
        }
      } catch (error) {
        this.$notify({
          type: "warning",
          icon: "tim-icons icon-alert-circle-exc",
          message: " Error deleting rule",
        });
      }
    },
    async updateStatusRule(rule) {
      try {
        const axiosHeader = {
          headers: {
            "Content-Type": "application/json",
            token: this.$store.state.auth.token,
          },
        };
        let ruleCopy = JSON.parse(JSON.stringify(rule));
        ruleCopy.status = !ruleCopy.status;
        const toSend = { rule: ruleCopy };
        const res = await this.$axios.put("/alarm-rule", toSend, axiosHeader);
        if (res.data.status) {
          this.$notify({
            type: "success",
            icon: "tim-icons icon-check-2",
            message: "Success! Alarm Rule was updated",
          });
          this.$store.dispatch("getDevices");
        }
      } catch (error) {
        this.$notify({
          type: "warning",
          icon: "tim-icons icon-alert-circle-exc",
          message: " Error updating rule",
        });
      }
    },
  },
};
</script>

