<template>
  <section class="section">
    <div class="container">
      <div class="columns">
        <div class="column is-3-desktop">
          <div class="content">
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
              <h3>Participants</h3>
              <b-table :data="participants" :columns="list_cols" />
            </div>
          </div>
        </div>
        <div class="column is-6-desktop">
          <div class="content has-text-centered">
            <b-button
              v-if="matches.length === 0"
              type="is-primary is-warning"
              :disabled="list.length < 2"
              @click="startTournament"
            >
              Begin Tournament
            </b-button>
            <h4 v-else class="title">
              Tournament in progress
            </h4>
            <hr>
            <b-table :data="matches" :columns="matches_cols" />
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
      list: [],
      matches: [],
      list_cols: [
        {
          field: 'name',
          label: 'Name'
        }
      ],
      matches_cols: [
        {
          field: 'round',
          label: 'Round'
        },
        {
          field: 'player1Name',
          label: 'Player 1'
        },
        {
          field: 'player2Name',
          label: 'Player 2'
        }
      ]
    }
  },
  mounted () {
    const id = this.$route.params.id
    this.id = id

    this.socket = this.$nuxtSocket({})

    this.socket.on('connect', () => console.log('socket connected'))

    this.socket.on('joinLobby', (data) => {
      console.log('receive joinLobby response from server', data)
      if (data.status === 'success') {
        console.log('successfully joined lobby')

        console.log('emit getParticipants')
        this.socket.emit('getParticipants', { id })
        // this.socket.emit('getList', { id })
        this.notify('Joined lobby!')

        console.log('getMatches', id)
        this.socket.emit('getMatches', { id })
      } else if (data.status === 'failed') {
        console.log('failed joining lobby')
        this.alertFail(data)
      }
    })

    // this.socket.on('getList', (data) => {
    //   console.log('receive getList response from server', data)
    //   if (data && data.length > 0) {
    //     this.list = data
    //   }
    // })

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
      this.socket.emit('getList', { id: this.id })
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
      } else if (data.status === 'failed') {
        this.alertFail(data)
      }
    })

    this.socket.on('getMatches', (data) => {
      console.log('receive getMatches response from server', data)
      if (data.status === 'success') {
        this.matches = this.processMatches(data.matches)
      } else if (data.status === 'failed') {
        this.alertFail(data)
      }
    })

    // startup
    console.log('joinLobby', id)
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
      console.log('emit joinLobby')
      this.socket.emit('joinLobby', { id })
    },
    startTournament () {
      console.log('emit startTournament')
      this.socket.emit('startTournament', { id: this.id })
    },
    processMatches (matchesResponse) {
      const matches = []

      console.log(this.list)
      matchesResponse.forEach((m) => {
        m = m.match

        const player1Name = this.getNameById(m.player1Id)
        const player2Name = this.getNameById(m.player2Id)

        matches.push({
          round: m.round,
          state: m.state,
          player1Name,
          player2Name,
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
      this.list.forEach((u) => {
        // console.log(u)
        if (u.id === id) {
          name = u.name
          return true
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
