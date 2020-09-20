<template>
  <section>
    <div class="hero is-small is-primary">
      <div class="hero-body">
        <div class="container">
          <div class="columns">
            <div class="column is-8-desktop is-offset-2-desktop">
              <h1 class="title is-2 has-text-centered">
                Built by <b-button outlined type="is-large is-light" @click="redirect('https://github.com/david-torres')">
                  @david-torres
                </b-button>
              </h1>
              <h2 class="subtitle is-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="content">
        <h2 class="title">
          Powered by:
        </h2>
        <ul class="list">
          <li class="list-item">
            <a href="https://nuxtjs.org/">NuxtJS</a>
          </li>
          <li class="list-item">
            <a href="https://vuejs.org/">Vue.js</a>
          </li>
          <li class="list-item">
            <a href="https://buefy.org/">Buefy</a>
          </li>
          <li class="list-item">
            <a href="https://bulma.io/">Bulma</a>
          </li>
          <li class="list-item">
            <a href="https://nuxt-socket-io.netlify.app/">nuxt-socket-io</a>
          </li>
          <li class="list-item">
            <a href="https://socket.io/">Socket.IO</a>
          </li>
          <li class="list-item">
            <a href="http://tidwell.github.io/node-challonge/">node-challonge</a>
          </li>
          <li class="list-item">
            <a href="https://api.challonge.com/v1">Challonge API</a>
          </li>
          <li class="list-item">
            <a href="https://www.npmjs.com/package/@chenfengyuan/vue-qrcode">@chenfengyuan/vue-qrcode</a>
          </li>
          <li class="list-item">
            <a href="https://fontawesome.com/">FontAwesome</a>
          </li>
          <li class="list-item">
            <a href="https://www.npmjs.com/package/shortid">shortid</a>
          </li>
        </ul>
      </div>
      <div class="content">
        <h2 class="title">
          Attribution:
        </h2>
        <ul class="list">
          <li class="list-item">
            This app uses assets from <a href="https://game-icons.net/">Game-Icons.net</a>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>

export default {
  name: 'About',
  components: { },
  mounted () {
  },
  methods: {
    redirect (url) {
      window.location.href = url
    }
  }
}
</script>

<style></style>
