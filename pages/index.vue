<template>
  <section>
    <div class="hero is-medium is-primary">
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
                for the classic game that was <a class="is-text is-link" href="http://www.samkass.com/theories/RPSSL.html">invented by Sam Kass</a>
                <br><br>
                <n-link to="/learn">
                  Learn more about how to play and use this app
                </n-link>
                <br>
                <br>
                <br>
                <div class="has-text-centered">
                  <b-button
                    icon-left="plus"
                    class="is-primary is-inverted is-large"
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
    </div>
    <div class="section">
      <div class="content">
        <br>
      </div>
    </div>
    <b-modal>
      <New />
    </b-modal>
  </section>
</template>

<script>
import New from '../components/new.vue'

export default {
  name: 'Index',
  components: { New },
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

      this.$buefy.modal.open({
        parent: this,
        component: New,
        hasModalCard: true,
        destroyOnHide: true,
        props: { id }
      })
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
