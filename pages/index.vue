<template>
  <section class="hero is-medium is-primary">
    <div class="hero-body">
      <div class="container">
        <div class="columns">
          <div class="column is-8-desktop is-offset-2-desktop">
            <h1 class="title is-2 is-spaced">
              Welcome to Rock Paper Scissors Spock Lizard Online Tournament
              Organizer!
            </h1>
            <h2 class="subtitle is-4">
              Rock Paper Scissors Spock Lizard?! Yep, it's an "expansion pack"
              for the classic game that was invented by Sam Kass. Learn more
              about how to play.
              <br>
              <br>
              <div class="has-text-centered">
                <b-button
                  class="is-primary is-inverted"
                  @click="newTournament"
                >
                  Create new tournament
                </b-button>
              </div>
            </h2>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>

export default {
  name: 'Index',
  components: {},
  mounted () {
    this.socket = this.$nuxtSocket({})
    this.socket.on('connect', () => console.log('socket connected'))
    this.socket.on('newTournament', (data) => {
      console.log('receive newTournament response from server', data)
      if (data.status === 'success') {
        this.newTournamentSuccess(data)
      } else if (data.status === 'failed') {
        this.newTournamentFail(data)
      }
    })
  },
  methods: {
    newTournament () {
      console.log('emit newTournament')
      this.socket.emit('newTournament')
    },
    newTournamentSuccess (data) {
      const id = data.id
      console.log('tournament data', data)
      this.$buefy.notification.open({
        message: 'New tournament created!',
        type: 'is-success',
        duration: 3000
      })

      const msg = `Join your
      tournament lobby here: <h1 class="title is-2 is-spaced"><a href="/lobby/${id}">/lobby/${id}</a></h1>`
      this.$buefy.dialog.alert(msg)
    },
    newTournamentFail (data) {
      const msg = data.message
      this.$buefy.dialog.alert({
        title: 'Error',
        message: msg,
        type: 'is-danger',
        hasIcon: true,
        icon: 'times-circle',
        iconPack: 'fa',
        ariaRole: 'alertdialog',
        ariaModal: true
      })
    }
  }
}
</script>

<style></style>
