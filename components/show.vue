<template>
  <form action="">
    <div class="modal-card" style="width: auto">
      <header class="modal-card-head">
        <p class="modal-card-title">
          Join this tournament!
        </p>
      </header>
      <section class="modal-card-body">
        <p>Share this link:</p>
        <h2 class="title is-3 is-spaced has-text-centered">
          <a :href="url" type="is-large is-primary">
            {{ url }}
          </a>
        </h2>
        <p>or scan this QR code with your mobile smartphone camera:</p>
        <div class="has-text-centered">
          <qrcode :value="url" :options="{ width: 300 }" />
        </div>
      </section>
      <footer class="modal-card-foot" />
    </div>
  </form>
</template>

<script>
export default {
  name: 'Show',
  components: {},
  props: {
    id: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      url: 'https://rps-tourney.detour.nyc/'
    }
  },
  mounted () {
    this.url = this.getUrl()
  },
  methods: {
    getUrl () {
      return window.location.protocol + '//' + window.location.host + '/lobby/' + this.id
    }
  }
}
</script>

<style>
</style>
