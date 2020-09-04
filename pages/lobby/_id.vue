<template>
  <section class="section">
    <div class="container">
      <div class="columns">
        <div class="column is-3-desktop">
          <div class="content">
            <h4 v-if="checked_in" class="subtitle">
              Checked-in as: {{ name }}
            </h4>
            <h6 v-else class="subtitle">
              You are <strong>NOT</strong> checked-in!
            </h6>
            <div v-if="!checked_in" id="check-in">
              <p>Register a name to check-in to the tournament.</p>
              <b-field label="Name">
                <b-input v-model="name" maxlength="20" size="is-medium" />
              </b-field>
              <div class="has-text-right">
                <b-button
                  type="is-primary is-light"
                  @click="checkIn"
                >
                  Check-In
                </b-button>
              </div>
              <hr>
            </div>
            <div id="participants">
              <h3 class="title">
                Participants
              </h3>
              <b-table
                :striped="true"
                :narrowed="true"
                :hoverable="true"
                :data="participants"
              >
                <template slot-scope="props">
                  <b-table-column field="name" label="Name">
                    <span :class="props.row.name === name ? 'strong' : ''">
                      {{ props.row.name }}
                    </span>
                  </b-table-column>
                  <b-table-column label="Connected?" width="20" class="has-text-centered">
                    <span>
                      <b-icon
                        pack="fas"
                        size="1x"
                        :icon="props.row.connected ? 'check' : 'plug'"
                        class="is-primary"
                      >
                        />
                      </b-icon>
                    </span>
                  </b-table-column>
                </template>
              </b-table>
            </div>
          </div>
        </div>
        <div class="column is-6-desktop">
          <div class="content has-text-centered">
            <div v-if="!tournament.startedAt" id="begin-tournament">
              <b-button
                v-if="matches.length === 0"
                type="is-primary is-warning"
                :disabled="participants.length < 2"
                @click="startTournament"
              >
                Begin Tournament
              </b-button>
            </div>
            <div v-else-if="tournament.startedAt" id="tournament-progress">
              <h4 v-if="tournament.state === 'underway'" class="title">
                Tournament in progress
              </h4>
              <h4 v-else-if="tournament.state === 'awaiting_review'" class="title">
                Tournament has ended. The winner is:
              </h4>
              <h1 v-if="tournament.state === 'awaiting_review'" class="has-text-centered">
                <span>
                  <b-icon
                    pack="fas"
                    size="1x"
                    icon="crown"
                    class="is-primary"
                  >
                    />
                  </b-icon>
                </span><br>
                {{ winner }}
              </h1>
            </div>
            <hr>
          </div>
          <div class="is-2">
            <b-menu>
              <b-menu-list label="Menu">
                <b-menu-item icon="play-circle" label="Begin Matches" class="menu-icon is-medium" :disabled="matches.length === 0" @click="startMatches" />
                <b-menu-item icon="times-circle" :active="false">
                  <template slot="label" slot-scope="props">
                    Danger Zone
                    <b-icon class="is-pulled-right" :icon="props.expanded ? 'caret-down' : 'caret-left'" />
                  </template>
                  <b-menu-item icon="redo" label="Reset Tournament" @click="resetTournament" />
                </b-menu-item>
              </b-menu-list>
            </b-menu>
          </div>
          <hr>

          <div>
            <b-table :data="matches" :striped="true" :narrowed="true" :hoverable="true">
              <template slot-scope="props">
                <b-table-column field="round" label="Round" width="20" class="has-text-centered">
                  {{ props.row.round }}
                </b-table-column>
                <b-table-column label="State" width="100">
                  {{ props.row.state }}
                </b-table-column>
                <b-table-column label="Player 1">
                  {{ props.row.player1Name }}
                </b-table-column>
                <b-table-column label="Player 2">
                  {{ props.row.player2Name }}
                </b-table-column>
                <b-table-column label="Winner" class="has-text-centered">
                  <h5 v-if="props.row.winnerName" class="subtitle">
                    <strong>{{ props.row.winnerName }}</strong>
                  </h5>
                </b-table-column>
              </template>
            </b-table>
          </div>
        </div>
        <div class="column is-2-desktop" />
      </div>
    </div>
    <b-modal
      v-model="game_active"
      has-modal-card
      trap-focus
      can-cancel
      :destroy-on-hide="false"
      aria-role="dialog"
      aria-modal
    >
      <Game />
    </b-modal>
  </section>
</template>

<script>
import Game from '../../components/game.vue'

export default {
  name: 'Lobby',
  components: { Game },
  data () {
    return {
      id: '',
      name: '',
      checked_in: false,
      game_active: false,
      participants: [],
      matches: [],
      current_game: {},
      tournament: {}
    }
  },
  computed: {
    winner () {
      let winner = ''
      if (!this.tournament.startedAt || !this.tournament.state === 'awaiting_review') {
        return winner
      }

      let round = 0
      let winnerId = null
      let winningMatch = null
      this.matches.forEach((m) => {
        if (m.round > round) {
          round = m.round
          winningMatch = m
        }
      })
      winnerId = winningMatch.winnerId
      winner = this.getNameById(winnerId)
      console.log('computed winner', winner, winnerId, round, winningMatch)

      return winner
    }
  },
  mounted () {
    const id = this.$route.params.id
    this.id = id

    // socket listeners
    this.socket = this.$nuxtSocket({ persist: 'me' })

    this.socket.on('connect', () => console.log('socket connected'))
    this.socket.on('disconnect', () => console.log('socket disconnected'))

    this.socket.on('joinLobby', (data) => {
      console.log('receive joinLobby response from server', data)
      if (data.status === 'success') {
        console.log('successfully joined lobby')
        this.notify('Joined lobby!')

        console.log('emit getTournament')
        this.socket.emit('getTournament', { id })
      } else if (data.status === 'failed') {
        console.log('failed joining lobby')
        this.alertFail(data)
      }
    })

    this.socket.on('checkIn', (data) => {
      console.log('receive checkIn response from server', data)
      if (data.status === 'success') {
        this.notify('Checked in!')
        this.checked_in = true
      } else {
        this.alert(data.message)
      }
    })

    this.socket.on('joinGame', (data) => {
      console.log('receive joinGame response from server', data)
      this.current_game = data
      this.game_active = true
      this.$buefy.modal.open({
        parent: this,
        component: Game,
        hasModalCard: true,
        trapFocus: true,
        canCancel: false,
        props: { id: this.id, game: this.current_game, name: this.name }
      })
    })

    this.socket.on('startedGame', (data) => {
      console.log('receive startedGame broadcast from server')
    })

    this.socket.on('getTournament', (data) => {
      console.log('receive getTournament response from server', data)
      if (data.status === 'success') {
        this.tournament = data.tournament

        if ('participants' in this.tournament) {
          this.participants = Object.values(this.tournament.participants)
        }
        if ('matches' in this.tournament) {
          this.matches = this.processMatches(Object.values(this.tournament.matches))
        }
      } else if (data.status === 'failed') {
        this.alertFail(data)
      }
    })

    this.socket.on('startTournament', (data) => {
      console.log('receive startTournament broadcast from server', data)
      if (data.status === 'success') {
        this.tournament = data.tournament

        if ('participants' in this.tournament) {
          this.participants = this.tournament.participants
        }
        if ('matches' in this.tournament) {
          this.matches = this.processMatches(Object.values(this.tournament.matches))
        }
        this.$forceUpdate()
        this.notify('Tournament has begun!')
      } else if (data.status === 'failed') {
        this.alertFail(data)
      }
    })

    this.socket.on('resetTournament', (data) => {
      console.log('receive resetTournament broadcast from server', data)
      if (data.status === 'success') {
        this.notify({
          message: 'Tournament has been reset!',
          type: 'is-warning',
          duration: 5000
        })

        this.socket.emit('getTournament', { id: this.id })
      } else if (data.status === 'failed') {
        this.alertFail(data)
      }
    })

    this.socket.on('getParticipants', (data) => {
      console.log('receive getParticipants response from server', data)
      if (data.status === 'success') {
        this.participants = data.participants
        this.$forceUpdate()
      } else if (data.status === 'failed') {
        this.alertFail(data)
      }
    })

    this.socket.on('getMatches', (data) => {
      console.log('receive getMatches response from server', data)
      if (data.status === 'success') {
        this.matches = this.processMatches(Object.values(data.matches))
        this.$forceUpdate()
      } else if (data.status === 'failed') {
        this.alertFail(data)
      }
    })

    // app startup
    this.joinLobby()
  },
  methods: {
    checkIn () {
      const id = this.id
      const name = this.name = this.name.trim()
      console.log('emit checkIn', name)
      this.socket.emit('checkIn', { id, name })
    },
    joinLobby () {
      console.log('emit joinLobby', this.id)
      this.socket.emit('joinLobby', { id: this.id })
    },
    startTournament () {
      console.log('emit startTournament')
      this.socket.emit('startTournament', { id: this.id })
    },
    resetTournament () {
      console.log('emit resetTournament')
      this.socket.emit('resetTournament', { id: this.id })
    },
    startMatches () {
      console.log('emit startMatches')
      this.socket.emit('startMatches', { id: this.id })
    },
    processMatches (matchesResponse) {
      const matches = []

      matchesResponse.forEach((m) => {
        m = m.match

        const player1Name = this.getNameById(m.player1Id)
        const player2Name = this.getNameById(m.player2Id)
        const winnerName = this.getNameById(m.winnerId)
        const loserName = this.getNameById(m.loserId)

        matches.push({
          round: m.round,
          state: m.state,
          player1Name,
          player2Name,
          winnerName,
          loserName,
          player1Id: m.player1Id,
          player2Id: m.player2Id,
          winnerId: m.winnerId,
          loserId: m.loserId
        })
      })

      return matches
    },
    getNameById (id) {
      let name = ''
      this.participants.forEach((u) => {
        if (u.id === id) {
          name = u.name
        }
      })
      return name
    },
    notify (msg) {
      this.$buefy.notification.open(msg)
    },
    alert (msg) {
      this.$buefy.dialog.alert(msg)
    },
    alertFail (data) {
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

<style>
  .menu-icon .icon {
    text-align: center;
    vertical-align: middle;
    margin-right: 10px;
  }

  li .icon {
    text-align: center;
    vertical-align: middle;
    margin-right: 10px;
  }
</style>
