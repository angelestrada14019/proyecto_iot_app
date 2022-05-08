export const state = () => ({
  auth: null,
  devices: [],
});

export const mutations = {
  setAuth(state, auth) {
    state.auth = auth;
  },
  setDevices(state, devices) {
    state.devices = devices;
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
        this.commit("setDevices", response.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  },
}
