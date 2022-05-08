export default function({store, redirect}) {
  store.dispatch('readToken');
  if (!store.state.auth) {
    return redirect('/login');
  }
}
