<template>
  <section class="section">
    <div class="container">
      <div class="columns">
        <div class="column is-3-desktop">
          <div class="content">
            <span v-if="checked_in">
              <b-message v-if="vip" type="is-info">
                You are the VIP
              </b-message>
              <b-message v-if="tournament.startedAt && tournament.state === 'awaiting_review' && winner === name" type="is-success">
                You are the Champion!
              </b-message>
            </span>
            <h6 v-if="!checked_in" class="subtitle">
              You are <strong>NOT</strong> checked-in!
            </h6>
            <div v-if="!checked_in" id="check-in">
              <p>Register a name to check-in to the tournament.</p>
              <b-field label="Name">
                <b-input v-model="name" maxlength="32" size="is-medium" />
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
                    <span v-if="props.row.vip">
                      <b-icon
                        pack="fas"
                        size="is-small"
                        icon="user-cog"
                        class="is-primary is-light"
                      >
                        />
                      </b-icon>
                    </span>
                    <span
                      :class="props.row.name === name ? 'has-text-weight-bold' : ''"
                      @mouseover="if (vip) { hover_player = props.row.name }"
                      @mouseleave="if (vip) { hover_player = false }"
                    >
                      <span v-if="hover_player === props.row.name && vip && vip !== props.row.name">
                        <b-button inverted outlined type="is-small is-light is-text" @click="dropPlayer(props.row.id, props.row.name)">
                          Drop {{ props.row.name }}?
                        </b-button>
                      </span>
                      <span v-else>{{ props.row.name }}</span>
                    </span>
                  </b-table-column>
                  <b-table-column width="20" class="has-text-centered">
                    <span>
                      <b-icon
                        pack="fas"
                        size="is-small"
                        :icon="props.row.connected ? 'check' : 'plug'"
                        class="is-primary"
                      >
                        />
                      </b-icon>
                    </span>
                  </b-table-column>
                </template>
              </b-table>
              <br>
              <div v-if="checked_in && vip">
                <b-button inverted outlined type="is-light is-text" @click="showInfo">
                  Show Joining Info
                </b-button>
              </div>
            </div>
          </div>
        </div>
        <div class="column is-6-desktop">
          <div class="content has-text-centered">
            <div id="tournament-progress">
              <h4 v-if="!tournament.startedAt && tournament.state === 'pending'" class="title">
                Waiting for the VIP to start the tournament
              </h4>
              <h4 v-if="tournament.startedAt && tournament.state === 'underway'" class="title">
                Tournament in progress
              </h4>
              <h4 v-else-if="tournament.startedAt && tournament.state === 'awaiting_review'" class="title">
                Tournament has ended. The winner is:
              </h4>
              <h1 v-if="tournament.startedAt && tournament.state === 'awaiting_review'" class="has-text-centered">
                <span>
                  <b-icon
                    pack="fas"
                    size="is-large"
                    icon="crown"
                    type="is-primary"
                  >
                    />
                  </b-icon>
                </span><br>
                {{ winner }}
              </h1>
            </div>
            <hr>
          </div>
          <div v-if="vip" class="is-2">
            <b-menu>
              <b-menu-list label="Menu">
                <b-menu-item
                  v-if="!tournament.startedAt"
                  icon="play-circle"
                  label="Begin Tournament"
                  class="menu-icon is-medium"
                  :disabled="participants.length < 2"
                  @click="startTournament"
                />
                <b-menu-item
                  v-if="tournament.startedAt"
                  icon="play-circle"
                  label="Begin Matches"
                  class="menu-icon is-medium"
                  :disabled="matches.length === 0"
                  @click="startMatches"
                />
                <b-menu-item v-if="tournament.startedAt" icon="exclamation-triangle" :active="false">
                  <template slot="label" slot-scope="props">
                    Danger Zone
                    <b-icon class="is-pulled-right" :icon="props.expanded ? 'caret-down' : 'caret-left'" />
                  </template>
                  <b-menu-item icon="redo" label="Reset Tournament" @click="resetTournament" />
                </b-menu-item>
              </b-menu-list>
            </b-menu>
            <hr>
          </div>

          <div v-if="matches.length > 0">
            <div class="media">
              <figure class="media-left">
                <p class="image is-64x64" />
              </figure>
              <div class="media-content">
                <div class="content">
                  <img
                    :src="live_image"
                    :alt="'Brackets for ' + id"
                  >
                </div>
              </div>
            </div>
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
    <b-modal>
      <Game />
    </b-modal>
    <b-modal>
      <Show />
    </b-modal>
  </section>
</template>

<script>
import Game from '../../components/game.vue'
import Show from '../../components/show.vue'

export default {
  name: 'Lobby',
  components: { Game, Show },
  data () {
    return {
      id: '',
      name: '',
      checked_in: false,
      game_active: false,
      participants: [],
      matches: [],
      current_game: {},
      tournament: {},
      url: '',
      live_image: '',
      hover_player: false
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
    },
    vip () {
      let vip = false
      this.participants.forEach((p) => {
        if (p.vip === true && p.name === this.name) {
          vip = p.name
        }
      })
      return vip
    }
  },
  mounted () {
    const id = this.$route.params.id
    this.url = window.location.href
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
        console.log('checked-in name', this.name)
        localStorage.setItem('name', this.name)
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
      if (data.status === 'success') {
        this.notify('Starting game')
      } else {
        this.alert(data.message)
      }
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

        this.updateLiveImage()

        this.$forceUpdate()
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

    this.socket.on('startMatches', (data) => {
      console.log('receive startMatches response from server', data)
      if (data.status === 'success') {
        this.notify({
          message: 'Matches sent!',
          type: 'is-info',
          duration: 1000
        })
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

    this.socket.on('droppedGame', (data) => {
      console.log('receive droppedGame response from server', data)
      if (data.status === 'success') {
        this.notify({
          message: data.player + ' has dropped from their game!',
          type: 'is-warning',
          duration: 5000
        })
      } else if (data.status === 'failed') {
        this.alertFail(data)
      }
    })

    this.socket.on('dropPlayer', (data) => {
      console.log('receive dropPlayer response from server', data)
      if (data.status === 'success') {
        this.notify({
          message: data.player + ' has been dropped from the tournament!',
          type: 'is-warning',
          duration: 5000
        })
      } else if (data.status === 'failed') {
        this.alertFail(data)
      }
    })

    // app startup
    this.joinLobby()
    setTimeout(this.autoLogin, 1000)
  },
  methods: {
    autoLogin () {
      const name = localStorage.getItem('name')
      if (name) {
        console.log('auto reconnect ' + name)
        this.name = name
        this.checkIn()
        this.$forceUpdate()
      }
    },
    checkIn () {
      const id = this.id
      const name = this.name = this.name.trim()
      console.log('emit checkIn', name)
      this.socket.emit('checkIn', { id, name })
    },
    dropPlayer (playerId, name) {
      this.$buefy.dialog.confirm({
        message: 'Drop ' + name + ' from the tournament?',
        onConfirm: () => {
          console.log('Drop player ' + playerId)
          this.socket.emit('dropPlayer', { id: this.id, playerId })
        }
      })
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
    showInfo () {
      this.$buefy.modal.open({
        parent: this,
        component: Show,
        hasModalCard: true,
        trapFocus: true,
        canCancel: true,
        props: { id: this.id }
      })
    },
    updateLiveImage () {
      this.live_image = this.tournament.liveImageUrl + '?' + (new Date().getTime())
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

  span .icon {
    text-align: center;
    vertical-align: middle;
    margin-right: 5px;
  }

  li .icon {
    text-align: center;
    vertical-align: middle;
    margin-right: 10px;
  }
</style>
