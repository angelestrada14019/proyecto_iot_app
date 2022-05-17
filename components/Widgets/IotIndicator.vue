<template>
<div>
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
      topic:"",

    }
  },
  watch:  {
            config: {
                immediate: true,
                deep: true, //niveles de anidacion
                handler() {
                    setTimeout(() => {
                        this.value = false;

                        this.$nuxt.$off(this.topic);

                       this.topic=this.config.userId + '/' + this.config.selectedDevice.dId + '/' + this.config.variable + '/sdata';
                        this.$nuxt.$on(this.topic, this.processReceivedData);
                    }, 300);
                }
            }
        },
  mounted(){
    this.topic=this.config.userId + '/' + this.config.selectedDevice.dId + '/' + this.config.variable + '/sdata';
    this.$nuxt.$on(this.topic, this.processReceivedData);
  },
  beforeDestroy(){
    this.$nuxt.$off(this.topic);
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
      try {
        this.value = data.value;
      } catch (error) {
        console.log("processReceivedData",error);
      }

    }
  }
}
</script>

