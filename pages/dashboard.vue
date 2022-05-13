<template>
  <div>
    <h2>Dashboard</h2>
    <div class="row" v-if="$store.state.devices.length > 0 && $store.state.selectedDevice !==null">

    <div
      v-for="(widget, index) in $store.state.selectedDevice.template.widgets"
      :key="index"
      :class="[widget.column]"

    >
      <div >
    <Json :value="fixWidget(widget)"></Json>

      <Rtnumberchart
        v-if="widget.widget == 'numberchart'"
        :config="fixWidget(widget)"
      ></Rtnumberchart>

      <Iotswitch
        v-if="widget.widget == 'switch'"
        :config="fixWidget(widget)"
      ></Iotswitch>

      <Iotbutton
        v-if="widget.widget == 'button'"
        :config="fixWidget(widget)"
      ></Iotbutton>

      <Iotindicator
        v-if="widget.widget == 'indicator'"
        :config="fixWidget(widget)"
      ></Iotindicator>
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import Iotbutton from "../components/Widgets/IotButton.vue";
import Iotindicator from "../components/Widgets/IotIndicator.vue";
import Iotswitch from "../components/Widgets/Iotswitch.vue";
import Rtnumberchart from "../components/Widgets/Rtnumberchart.vue";

export default {
  name: "Dashboard",
  components: {
    Iotindicator,
    Iotbutton,
    Iotswitch,
    Rtnumberchart,
  },
  data() {
    return {
    }
  },
  mounted() {

  },
  methods: {
    fixWidget(widget){
      let widgetCopy = JSON.parse(JSON.stringify(widget));
      widgetCopy.selectedDevice.dId = this.$store.state.selectedDevice.dId;
      widgetCopy.selectedDevice.name = this.$store.state.selectedDevice.name;
      widgetCopy.userId = this.$store.state.selectedDevice.userId;
      if (widget.widget =="numberchart"){
        widgetCopy.demo = false;
      }

      return widgetCopy;
    }
  },
};

</script>
