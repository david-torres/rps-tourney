<template>
  <form action="">
    <div class="modal-card" style="width: auto">
      <header class="modal-card-head">
        <p class="modal-card-title">
          Join your new tournament!
        </p>
      </header>
      <section class="modal-card-body">
        <h2 class="title is-3 is-spaced has-text-centered">
          <b-button outlined type="is-large is-primary" @click="go()">
            {{ url }}
          </b-button>
        </h2>
        <p>Click the link above to check-in to your tournament, then send it out to your participants! Make sure you get in first so you can become the VIP and gain special admin controls.</p><br>
        <p>You can also scan/share the QR code below.</p>
        <div class="has-text-centered">
          <qrcode :value="url" :options="{ width: 200 }" />
        </div>
      </section>
      <footer class="modal-card-foot" />
    </div>
  </form>
</template>

<script>
export default {
  name: 'NewTournament',
  components: {},
  props: {
    id: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      url: ''
    }
  },
  mounted () {
    this.url = this.getUrl()
  },
  methods: {
    go () {
      this.$router.push('/lobby/' + this.id)
      this.$parent.close()
    },
    getUrl () {
      return window.location.protocol + '//' + window.location.host + '/lobby/' + this.id
    }
  }
}
</script>

<style>
</style>
