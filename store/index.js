export const state = () => ({
  auth: null,
  devices: [],
  selectedDevice: {},
  notifications: []
});

export const mutations = {
  setAuth(state, auth) {
    state.auth = auth;
  },
  setDevices(state, devices) {
    state.devices = devices;
  },
  setSelectedDevice(state, device) {
    state.selectedDevice = device;
  },
  setNotifications(state, notifications) {
    state.notifications = notifications;
  }
}
export const actions = {
  readToken() {
    let auth = null;
    try {
      auth = JSON.parse(localStorage.getItem('auth'));

    } catch (error) {
      console.log(error);
    }
    this.commit('setAuth', auth);

  },
  getDevices() {
    const axiosHeader = {
      headers: {
        "Content-Type": "application/json",
        token: this.state.auth.token,
      },
    };
    this.$axios
      .get("/device", axiosHeader)
      .then((response) => {
        console.log(response.data.data);
        response.data.data.forEach((device,index) => {
          if(device.selected){
          if (device.saverRule.status) {
            $nuxt.$emit('selectedDeviceIndex', index);
            this.commit('setSelectedDevice', device);

          }else{
            this.commit('setSelectedDevice', null);
          }
        }
        })
        this.commit("setDevices", response.data.data);
      })
      .catch((error) => {
        console.log("error", error);
        console.log(error);
      });
  },
  getNotifications() {

    const axiosHeader = {
      headers: {
        "Content-Type": "application/json",
        token: this.state.auth.token
      }
    };

    this.$axios.get("/notifications", axiosHeader)
    .then(res => {
      console.log("notification",res.data.data);
      this.commit("setNotifications", res.data.data)
    }).catch(error => {
      console.log(error);
    });

  }

}
