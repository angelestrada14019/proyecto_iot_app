<template>
  <card>
    <template slot="header">
      <h5 class="card-category">
        {{ config.selectedDevice.name }} - {{ config.variableFullName }}
      </h5>

      <h3 class="card-title">
        <i
          class="fa"
          :class="[config.icon, getIconColorClass()]"
          aria-hidden="true"
          style="font-size: 30px"
        ></i>
        <base-switch
          @click="
            value = !value;
            sendValue();
          "
          :value="value"
          type="primary"
          on-text="ON"
          off-text="OFF"
          style="margin-top: 10px"
          class="pull-right"
        >
        </base-switch>
      </h3>
    </template>
  </card>
</template>


<script>
export default {
  name: "iotswitch",
  props: ["config"],

  data() {
    return {
      value: true,
    };
  },
  watch: {
    config: {
      immediate: true,
      deep: true,
      handler() {},
    },
  },

  mounted() {},
  beforeDestroy() {},
  methods: {
    getIconColorClass() {
      //para apagar el icono
      if (!this.sending) {
        return "text-dark";
      } else {
        return "text-" + this.config.class;
      }
    },

    sendValue() {
      const toSend = {
        topic:
          this.config.userId +
          "/" +
          this.config.selectedDevice.dId +
          "/" +
          this.config.variable +
          "/actdata",
        msg: {
          value: this.value,
        },
      };

      $nuxt.$emit("mqtt-sender", toSend);
    },
  },
};
</script>
<style></style>
