<template>
  <section class="section">
    <div class="container">
      <div class="columns">
        <div class="column is-3-desktop">
          <div class="content">
            <h4 v-if="name" class="subtitle">
              You are checked-in as: {{ name }}
            </h4>
            <h6 v-else class="subtitle">
              You are <strong>NOT</strong> checked-in!
            </h6>
            <div v-if="!checked_in" id="check-in">
              <p>Register a name to check-in to the tournament.</p>
              <b-field label="Name">
                <b-input v-model="name" />
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
                  <b-table-column label="Connected" width="20" class="has-text-centered">
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
            <b-button
              v-if="matches.length === 0"
              type="is-primary is-warning"
              :disabled="participants.length < 2"
              @click="startTournament"
            >
              Begin Tournament
            </b-button>
            <h4 v-else class="title">
              Tournament in progress
            </h4>
            <hr>
            <b-table :data="matches" :striped="true" :narrowed="true" :hoverable="true">
              <template slot-scope="props">
                <b-table-column field="round" label="Round" width="10" class="has-text-centered">
                  {{ props.row.round }}
                </b-table-column>
                <b-table-column label="State" width="20">
                  {{ props.row.state }}
                </b-table-column>
                <b-table-column label="Player 1">
                  {{ props.row.player1Name }}
                </b-table-column>
                <b-table-column label="Player 2">
                  {{ props.row.player2Name }}
                </b-table-column>
                <b-table-column label="Winner" class="has-text-centered">
                  <span v-if="props.row.winnerName">
                    <b-icon
                      pack="fas"
                      size="1x"
                      icon="crown"
                      class="is-primary"
                    >
                      />
                    </b-icon>
                  </span>
                  <h5 v-if="props.row.winnerName" class="subtitle">
                    {{ props.row.winnerName }}
                  </h5>
                </b-table-column>
              </template>
            </b-table>
          </div>
        </div>
        <div class="column is-2-desktop" />
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'Lobby',
  components: {},
  data () {
    return {
      id: '',
      name: '',
      checked_in: false,
      participants: [],
      matches: [],
      matches_cols: [
        {
          field: 'round',
          label: 'Round'
        },
        {
          field: 'state',
          label: 'State'
        },
        {
          field: 'player1Name',
          label: 'Player 1'
        },
        {
          field: 'player2Name',
          label: 'Player 2'
        },
        {
          field: 'winnerName',
          label: 'Winner'
        }
      ]
    }
  },
  mounted () {
    const id = this.$route.params.id
    this.id = id

    // socket listeners
    this.socket = this.$nuxtSocket({})

    this.socket.on('connect', () => console.log('socket connected'))

    this.socket.on('joinLobby', (data) => {
      console.log('receive joinLobby response from server', data)
      if (data.status === 'success') {
        console.log('successfully joined lobby')
        this.notify('Joined lobby!')

        console.log('emit getParticipants')
        this.socket.emit('getParticipants', { id })
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
        this.alert('The name you entered is taken: ' + data.name)
      }
    })

    this.socket.on('checkedIn', (data) => {
      console.log('receive checkedIn broadcast from server', data)
      this.socket.emit('getParticipants', { id: this.id })
    })

    this.socket.on('startTournament', (data) => {
      console.log('receive startTournament broadcast from server', data)
      if (data.status === 'success') {
        this.notify('Tournament has begun!')
        this.socket.emit('getMatches', { id: this.id })
      } else if (data.status === 'failed') {
        this.alertFail(data)
      }
    })

    this.socket.on('getParticipants', (data) => {
      console.log('receive getParticipants response from server', data)
      if (data.status === 'success') {
        data.participants.forEach((p) => {
          console.log(p)
        })
        this.participants = data.participants
        this.$forceUpdate()

        console.log('emit getMatches', id)
        this.socket.emit('getMatches', { id })
      } else if (data.status === 'failed') {
        this.alertFail(data)
      }
    })

    this.socket.on('getMatches', (data) => {
      console.log('receive getMatches response from server', data)
      if (data.status === 'success') {
        this.matches = this.processMatches(data.matches)
        this.$forceUpdate()
      } else if (data.status === 'failed') {
        this.alertFail(data)
      }
    })

    // app startup
    this.joinLobby(id)
  },
  methods: {
    checkIn () {
      const id = this.id
      const name = this.name
      console.log('emit checkIn', name)
      this.socket.emit('checkIn', { id, name })
    },
    joinLobby (id) {
      console.log('emit joinLobby', id)
      this.socket.emit('joinLobby', { id })
    },
    startTournament () {
      console.log('emit startTournament')
      this.socket.emit('startTournament', { id: this.id })
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
      // console.log(matches)
      return matches
    },
    getNameById (id) {
      // console.log(id)
      let name = ''
      this.participants.forEach((u) => {
        // console.log(u)
        if (u.id === id) {
          name = u.name
          // return true
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

<style></style>
