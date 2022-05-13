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
                type="text"
                placeholder="Home, Office, etc."
                v-model="newDevice.name"
              ></base-input>
            </div>
          </div>
          <div class="col-4">
            <base-input
              label="Device Id"
              type="text"
              placeholder="777"
              v-model="newDevice.dId"
            ></base-input>
          </div>
          <div class="col-4">
            <slot name="label">
              <label for="template">Template {{selectedIndexTemplate}}</label>
            </slot>
            <el-select
              v-model="selectedIndexTemplate"
              id="template"
              class="select-primary"
              placeholder="Select Template"
              style="width: 100%"
            >
              <el-option
                v-for="(template, index) in templates"
                :key="template._id"
                :label="template.name"
                :value="index"
                class="text-dark"
              ></el-option>
            </el-select>
          </div>
        </div>
        <div class="row pull-right">
          <div class="col-12">
            <base-button @click="createNewDevice()" type="primary" label="Add" class="mb-3" size="lg"
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
            <el-table-column label="Password" prop="password"></el-table-column>
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
                      'text-success': row.saverRule.status,
                      'text-dark': !row.saverRule.status,
                    }"
                  ></i>
                </el-tooltip>
                <el-tooltip content="Database Save">
                  <base-switch
                    @click="updateSaverRuleStatus(row.saverRule)"
                    :value="row.saverRule.status"
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
  data() {
    return {
      templates: [],
      selectedIndexTemplate: null,
      newDevice:{
        name: "",
        dId: "",
        templateId: "",
        templateName: "",
      }
    };
  },
  mounted() {
    //this.$store.dispatch("getDevices");
    this.getTemplates();
  },
  methods: {
    async getTemplates() {
      try {
        const axiosHeader = {
          headers: {
            "Content-Type": "application/json",
            token: this.$store.state.auth.token,
          },
        };
        const res = await this.$axios.get("/template", axiosHeader);
        console.log(res.data);
        if (res.data.status) {
          this.templates = res.data.data;
        }
      } catch (error) {
        console.log(error);
        this.$notify({
          type: "danger",
          icon: "tim-icons icon-alert-circle-exc",
          message: "Somethin went wrong with get templates",
        });
      }
    },
   async createNewDevice() {
      if(this.newDevice.name==="" || this.newDevice.dId==="" || this.selectedIndexTemplate===null){
        this.$notify({
          type: "warning",
          icon: "tim-icons icon-alert-circle-exc",
          message: "Please enter device name or device id or choose template",
      });
      return;
      }
      try {
        const axiosHeader = {
          headers: {
            "Content-Type": "application/json",
            token: this.$store.state.auth.token,
          },
        };
        this.newDevice.templateId = this.templates[this.selectedIndexTemplate]._id;
        this.newDevice.templateName = this.templates[this.selectedIndexTemplate].name;
        const toSend={
          newDevice: this.newDevice
        }
        const res = await this.$axios.post("/device", toSend, axiosHeader);
        if (res.data.status) {
          this.newDevice.name="";
          this.newDevice.dId="";
          this.selectedIndexTemplate = null;
          this.$notify({
            type: "success",
            icon: "tim-icons icon-check-2",
            message: "Device added successfully",
          });
          this.$store.dispatch("getDevices");
        }
      } catch (error) {
        console.log(error);
        this.$notify({
          type: "danger",
          icon: "tim-icons icon-alert-circle-exc",
          message: "Somethin went wrong with create new device, may be try again with different device id",
        });
      }
    },
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
    updateSaverRuleStatus(rule) {
      let ruleCopy = JSON.parse(JSON.stringify(rule));
      ruleCopy.status = !ruleCopy.status;
      const toSend = {
        rule: ruleCopy
      };
      const axiosHeaders = {
        headers: {
          token: this.$store.state.auth.token
        }
      };
      this.$axios
        .put("/saver-rule", toSend, axiosHeaders)
        .then(res => {
          if (res.data.status) {
            this.$store.dispatch("getDevices");
            this.$notify({
              type: "success",
              icon: "tim-icons icon-check-2",
              message: " Device Saver Status Updated"
            });
          }

          return;
        })
        .catch(e => {
          console.log(e);
          this.$notify({
            type: "danger",
            icon: "tim-icons icon-alert-circle-exc",
            message: " Error updating saver rule status"
          });
          return;
        });
    }
  },
};
</script>

<style>
.el-table th.el-table__cell {
  background-color: transparent;
}
</style>
