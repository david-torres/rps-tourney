<template>
  <section class="section">
    <div class="container">
      <div class="columns">
        <div class="column is-8-desktop is-offset-2-desktop">
          <div class="content">
            <h3>Game</h3>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'Game',
  components: {},
  sockets: {
    connect: () => {
      console.log('socket connected')
    },
    joinGame: (data) => {
      console.log(data)
    }
  },
  methods: {
    joinGame () {
      console.log('emit event')
      this.$socket.emit('joinGame')
    }
  }
}
</script>

<style></style>
