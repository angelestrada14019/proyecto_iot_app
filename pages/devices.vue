<template>
  <div>
    <!--  add devices -->
    <div class="row">
      <card>
        <div slot="header">
          <h4 class="card-title">Add new Device</h4>
        </div>
        <div class="row">
          <div class="col-4">
            <div class="form-group">
              <base-input
                label="Device Name"
                type="test"
                placeholder="Home."
              ></base-input>
            </div>
          </div>
          <div class="col-4">
            <base-input
              label="Device Id"
              type="test"
              placeholder="777"
            ></base-input>
          </div>
          <div class="col-4">
            <slot name="label">
              <label for="template">Template</label>
            </slot>
            <el-select
              value="Select device template"
              id="template"
              class="select-primary"
              placeholder="Select Template"
              style="width: 100%"
            >
              <el-option
                class="text-dark"
                label="Home"
                value="home"
              ></el-option>
              <el-option
                class="text-dark"
                label="Office"
                value="office"
              ></el-option>
              <el-option
                class="text-dark"
                label="template1"
                value="template1"
              ></el-option>
            </el-select>
          </div>
        </div>
        <div class="row pull-right">
          <div class="col-12">
            <base-button type="primary" label="Add" class="mb-3" size="lg"
              >Add</base-button
            >
          </div>
        </div>
      </card>
    </div>
    <!--  end add devices -->
    <!-- Devices table view -->
    <div class="row">
      <card slot="header">
        <div slot="header">
          <h4 class="card-title">Devices</h4>
        </div>
        <div>
          <el-table :data="$store.state.devices">
            <el-table-column label="#" min-width="50">
              <div slot-scope="{ $index }">
                <p>{{ $index + 1 }}</p>
              </div>
            </el-table-column>
            <el-table-column label="Name" prop="name"></el-table-column>
            <el-table-column label="Device Id" prop="dId"></el-table-column>
            <el-table-column
              label="Template"
              prop="templateName"
            ></el-table-column>
            <el-table-column label="Actions">
              <div slot-scope="{ row, $index }">
                <el-tooltip
                  content="Server Status Indicator"
                  style="margin-right: 10px"
                >
                  <i
                    class="fas fa-database"
                    :class="{
                      'text-success': row.saverRule,
                      'text-dark': !row.saverRule,
                    }"
                  ></i>
                </el-tooltip>
                <el-tooltip content="Database Save">
                  <base-switch
                    @click="updateSaverRuleStatus($index)"
                    :value="row.saverRule"
                    type="primary"
                    on-text="On"
                    off-text="Off"
                  ></base-switch>
                </el-tooltip>
                <el-tooltip
                  content="Delete"
                  effect="light"
                  :open-delay="300"
                  placement="top"
                >
                  <base-button
                    type="danger"
                    icon
                    size="sm"
                    class="btn-link"
                    @click="deleteDevice(row)"
                  >
                    <i class="tim-icons icon-simple-remove"></i>
                  </base-button>
                </el-tooltip>
              </div>
            </el-table-column>
          </el-table>
        </div>
      </card>
    </div>
    <!-- End Devices table view -->
    <Json :value="$store.state.devices"> </Json>
  </div>
</template>

<script>
import { Table, TableColumn } from "element-ui";
import { Select, Option } from "element-ui";

export default {
  components: {
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
    [Select.name]: Select,
    [Option.name]: Option,
  },
  mounted() {
    this.$store.dispatch("getDevices");
  },
  methods: {
    deleteDevice(device) {
      const axiosHeader = {
        headers: {
          "Content-Type": "application/json",
          token: this.$store.state.auth.token,
        },
        params: {
          dId: device.dId,
        },
      };
      this.$axios
        .delete("/device", axiosHeader)
        .then((response) => {
          console.log(response.data);
          if (response.data.status) {
            this.$notify({
              type: "success",
              icon: "tim-icons icon-check-2",
              message: `Device ${device.name} deleted successfully`,
            });
            this.$store.dispatch("getDevices");
          }
        })
        .catch((error) => {
          console.log(error);
          this.$notify({
            type: "danger",
            icon: "tim-icons icon-simple-remove",
            message: `Device ${device.name} not deleted`,
          });
        });
    },
    updateSaverRuleStatus(index) {
      this.devices[index].saverRule = !this.devices[index].saverRule;
    },
  },
  data() {
    return {};
  },
};
</script>

<style>
.el-table th.el-table__cell {
  background-color: transparent;
}
</style>
