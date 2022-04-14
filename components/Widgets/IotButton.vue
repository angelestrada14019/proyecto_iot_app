<template>
  <div :class="[config.column]">
    <card>
      <div slot="header">
        <h4 class="card-title">
          {{ config.selectedDevice.name }}-{{ config.variableFullName }}
        </h4>
      </div>
      <i
        class="fa"
        :class="[config.icon, getIconColorClass()]"
        style="font-size: 30px"
      ></i>
      <base-button @click="sendValue()" :type="config.class" label="Add" class="mb-3 pull-right" size="lg"
        >Add</base-button
      >
    </card>
  </div>
</template>

<script>
export default {
  props:['config'],
  data() {
    return {
      sending: false,
    };
  },
  mounted() {},
  methods: {
    sendValue() {
      this.sending = true;
      setTimeout(() => {
        this.sending = false;
      }, 500);
      const toSend={
        topic: this.config.userId + "/" + this.config.selectedDevice.dId + "/" + this.config.variable + "/actdata",
        msg:{
          value: this.config.message
        }
      }
      console.log("sendValue",toSend);
      this.$nuxt.$emit('mqtt-sender', { value: !this.value });
    },
    getIconColorClass() {
      if (!this.sending) {
        return "text-dark";
      } else {
        return "text-" + this.config.class;
      }
    },
  },
};
</script>
