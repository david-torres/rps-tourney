<template>
  <form action="">
    <div class="modal-card" style="width: auto">
      <header class="modal-card-head">
        <p class="modal-card-title">
          You are battling: <strong>{{ opponent }}</strong>
        </p>
        <button
          type="button"
          class="delete"
          @click="$emit('close')"
        />
      </header>
      <section class="modal-card-body">
        <h2 class="subtitle is-3 is-spaced">
          Choose your weapon!
        </h2>
        <b-notification ref="weapon" :closable="false">
          <b-tooltip label="Rock">
            <b-button type="is-primary is-light is-large" @click="throwWeapon('rock')">
              <img src="/img/rock.png" height="50" width="50" alt="Rock" class="game-icon">
            </b-button>
          </b-tooltip>
          <b-tooltip label="Paper">
            <b-button type="is-primary is-light is-large" @click="throwWeapon('paper')">
              <img src="/img/folded-paper.png" height="50" width="50" alt="Paper" class="game-icon">
            </b-button>
          </b-tooltip>
          <b-tooltip label="Scissors">
            <b-button type="is-primary is-light is-large" @click="throwWeapon('scissors')">
              <img src="/img/scissors.png" height="50" width="50" alt="Scissors" class="game-icon">
            </b-button>
          </b-tooltip>
          <b-tooltip label="Spock">
            <b-button type="is-primary is-light is-large" @click="throwWeapon('spock')">
              <img src="/img/palm-vulcan.png" height="50" width="50" alt="Spock" class="game-icon">
            </b-button>
          </b-tooltip>
          <b-tooltip label="Lizard">
            <b-button type="is-primary is-light is-large" @click="throwWeapon('lizard')">
              <img src="/img/gecko.png" height="50" width="50" alt="Lizard" class="game-icon">
            </b-button>
          </b-tooltip>
        </b-notification>
      </section>
      <footer class="modal-card-foot" />
    </div>
  </form>
</template>

<script>

export default {
  name: 'Game',
  components: {},
  props: {
    id: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      default: ''
    },
    game: {
      type: Object,
      default: () => {
        return {
          id: 0,
          player1: {
            id: 0,
            name: ''
          },
          player2: {
            id: 0,
            name: ''
          }
        }
      }
    }
  },
  data () {
    return {
      opponent: '',
      spinner: null
    }
  },
  mounted () {
    this.socket = this.$nuxtSocket({ persist: 'me' })

    this.socket.on('throwWeapon', (data) => {
      if (data.status === 'success') {
        this.$buefy.notification.open('You threw ' + data.weapon + '!')
      } else if (data.status === 'failed') {
        this.$buefy.dialog.alert('Throwing failed!')
      }
    })

    this.socket.on('matchResults', (data) => {
      this.spinner.close()
      if (data.status === 'success') {
        const game = data.game
        if (game.winnerName === this.name) {
          this.$buefy.notification.open({
            message: 'You Won!',
            type: 'is-success',
            duration: 5000
          })
        } else {
          this.$buefy.notification.open({
            message: 'You Lost...',
            type: 'is-danger',
            duration: 5000
          })
        }
        this.$parent.close()
      } else if (data.status === 'failed') {
        this.$buefy.dialog.alert('Match failed!')
      }
    })

    this.socket.on('matchTie', (data) => {
      console.log('received matchTie')
      this.$parent.close()
      this.$buefy.notification.open({
        message: 'Tie! Throw again',
        type: 'is-info',
        duration: 1000
      })
    })

    console.log('game component mounted')
    this.opponent = this.getOpponentName()
  },
  methods: {
    getOpponentName () {
      if (this.game.player1.name === this.name) {
        return this.game.player2.name
      } else {
        return this.game.player1.name
      }
    },
    throwWeapon (weapon) {
      console.log('emit throwWeapon', weapon)
      this.spinner = this.$buefy.loading.open({
        container: this.$refs.weapon.$el
      })
      this.socket.emit('throwWeapon', { id: this.id, gameId: this.game.id, weapon })
    }
  }
}
</script>

<style>
.game-icon {
  text-align: center;
  vertical-align: middle;
}
</style>
