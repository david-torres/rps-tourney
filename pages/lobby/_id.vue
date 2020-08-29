<template>
  <section class="section">
    <div class="container">
      <div class="columns">
        <div class="column is-8-desktop is-offset-2-desktop">
          <div class="content">
            <h3>Lobby</h3>
            <p>Register a name to check-in to the tournament.</p>
            <b-field label="Name">
              <b-input v-model="name" />
            </b-field>
            <div class="has-text-right is-2">
              <b-button
                type="is-primary is-light"
                @click="checkIn"
              >
                Check-In
              </b-button>
              <hr>
              <b-table :data="list" :columns="columns" />
            </div>
          </div>
        </div>
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
      list: [],
      columns: [
        {
          field: 'name',
          label: 'Name'
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
        this.socket.emit('getList', { id })
        this.joinLobbySuccess(data)
      } else if (data.status === 'failed') {
        console.log('failed joining lobby')
        this.joinLobbyFail(data)
      }
    })

    this.socket.on('getList', (data) => {
      console.log('receive getList response from server', data)
      if (data && data.length > 0) {
        const list = []
        data.forEach((name) => {
          list.push({ name })
        })
        this.list = list
        // this.$set(this, 'list', data)
        // console.log('reactive', this.list)
        // this.$forceUpdate()
      }
    })

    this.socket.on('checkedIn', (data) => {
      console.log('receive checkedIn broadcast from server', data)
      // this.list.push({ name: data.name })
      this.socket.emit('getList', { id: this.id })
      console.log(this.list)
    })
    console.log('joinLobby', id)
    this.joinLobby(id)
  },
  methods: {
    checkIn () {
      const id = this.id
      const name = this.name
      console.log(name)
      this.socket.emit('checkIn', { id, name })
    },
    joinLobby (id) {
      console.log('emit joinLobby')
      this.socket.emit('joinLobby', { id })
    },
    joinLobbySuccess (data) {
      // const id = data.id
      this.$buefy.notification.open('Joined lobby!')

      // const msg = `Join your
      // tournament lobby here: <h1 class="title is-2 is-spaced"><a href="/lobby/${id}">/lobby/${id}</a></h1>`
      // this.$buefy.dialog.alert(msg)
    },
    joinLobbyFail (data) {
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
