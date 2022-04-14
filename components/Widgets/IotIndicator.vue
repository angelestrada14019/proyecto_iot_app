<template>
<div :class="[config.column]">
  <card >
    <div slot="header">
      <h4 class="card-title">{{config.selectedDevice.name}}-{{config.variableFullName}}</h4>
    </div>
    <i class="fa " :class="[config.icon,getIconColorClass()]" style="font-size:30px"></i>
  </card>
</div>

</template>

<script>
export default {
 props:['config'],
  data(){
    return {
      value:false,

    }
  },
  mounted(){
    const topic=this.config.userId + '/' + this.config.selectedDevice.dId + '/' + this.config.variable + '/sdata';
    this.$nuxt.$on(topic, this.processReceivedData);
  },
  beforeDestroy(){
    const topic=this.config.userId + '/' + this.config.selectedDevice.dId + '/' + this.config.variable + '/sdata';
    this.$nuxt.$off(topic);
  },
  methods:{
    getIconColorClass(){
      if(!this.value){
        return "text-dark"
      }else{
        return "text-"+this.config.class
      }
    },
    processReceivedData(data){
      console.log("processReceivedData",data);
        this.value = data.value;
    }
  }
}
</script>

