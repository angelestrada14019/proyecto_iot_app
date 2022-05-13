<template>
  <div class="row">
    <h2></h2>
  </div>
</template>

<script>
export default {
  middleware: "authenticated",
  mounted() {
    $nuxt.$router.push('/dashboard');
  }
}
</script>
