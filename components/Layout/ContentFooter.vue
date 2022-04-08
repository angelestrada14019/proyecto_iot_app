<template>
  <footer class="footer">
    <div class="container-fluid">
      <ul class="nav">

        <li class="nav-item">
          <Nuxt-link
            to="#"

            class="nav-link"
          >
            About Us
          </Nuxt-link>
        </li>
        <li class="nav-item">
          <a
            href="https://github.com/angelestrada14019"
            target="_blank"
            rel="noopener"
            class="nav-link"
          >
            publications
          </a>
        </li>
      </ul>
      <div class="copyright">
        &copy; {{ year }}, made with <i class="tim-icons icon-heart-2"></i> by
        <span>AJEA</span>.
      </div>
    </div>
  </footer>
</template>
<script>
export default {
  data() {
    return {
      year: new Date().getFullYear()
    };
  }
};
</script>
<style>
span{
  color: #ba54f5;
}
</style>
