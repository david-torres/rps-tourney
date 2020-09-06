const challonge = require('challonge')
const shortid = require('shortid')

const store = {}

shortid.characters(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_?'
)

// create an instance of the challonge client
const client = challonge.createClient({
  apiKey: process.env.challonge_api_key || ''
})

export default function (socket, io) {
  return Object.freeze({
    disconnect () {
      console.log('a client disconnected')
      disconnect(socket, io)
    },
    newTournament () {
      console.log('a client requested a new tournament')
      createTournament(client, socket, io)
    },
    getTournament (data) {
      console.log('a client requested tournament ' + data.id)
      getTournament(client, socket, io, data.id)
    },
    startTournament (data) {
      const id = data.id
      console.log('a client requested to begin tournament ' + id)
      startTournament(client, io, id)
    },
    resetTournament (data) {
      const id = data.id
      console.log('a client requested to reset tournament ' + id)
      resetTournament(client, io, id)
    },
    joinLobby (data) {
      const id = data.id
      console.log('a client requested to join lobby ' + id)
      joinLobby(socket, io, id)
    },
    checkIn (data) {
      const id = data.id
      const name = data.name
      console.log('a client requested to check-in as ' + name + ' to lobby ' + id)
      checkIn(socket, io, id, name)
    },
    getParticipants (data) {
      const id = data.id
      console.log('a client requested participants for lobby ' + id)
      getParticipants(client, socket, io, id)
    },
    getMatches (data) {
      const id = data.id
      console.log('a client requested matches for lobby ' + id)
      getMatches(client, socket, id)
    },
    startMatches (data) {
      const id = data.id
      console.log('a client requested to start matches for lobby ' + id)
      startMatches(client, socket, io, id)
    },
    throwWeapon (data) {
      const id = data.id
      const gameId = data.gameId
      const weapon = data.weapon
      console.log('a client requested to throw ' + weapon + ' for game ' + gameId)
      throwWeapon(client, socket, io, id, gameId, weapon)
    }
  })
}

const getId = () => shortid.generate().replace('?', '_')

const disconnect = (socket, io) => {
  for (const id of Object.keys(store)) {
    for (const name of Object.keys(store[id])) {
      const u = store[id][name]
      if (u.socket) {
        if (u.socket.id === socket.id) {
          updateUser(u, null)
        }
      }
    }
  }
}

const createTournament = (client, socket, io) => {
  const id = getId()
  const status = 'failed'
  const response = { id, status }

  // create a tournament
  client.tournaments.create({
    tournament: {
      name: 'Rock Paper Scissors Spock Lizard Tournament (' + id + ')',
      url: id,
      tournamentType: 'single elimination',
      description:
        'Rock Paper Scissors Spock Lizard Tournament. Single Elimination.',
      openSignup: false,
      private: true
    },
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        response.message = err.errors[0]
        socket.emit('newTournament', response)
        return
      }

      response.status = 'success'
      response.tournament = data.tournament

      console.log('newTournament response')
      socket.emit('newTournament', response)
    }
  })
}

const getTournament = (client, socket, io, id) => {
  const status = 'failed'
  const response = { id, status }

  // show a tournament
  client.tournaments.show({
    id,
    includeParticipants: 1,
    includeMatches: 1,
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        response.message = err.errors[0]
        socket.emit('getTournament', response)
        return
      }

      response.status = 'success'
      response.tournament = data.tournament

      let participants = Object.values(processParticipants(id, Object.values(data.tournament.participants)))
      // remove socket, causes issues with serialization
      participants = participants.map((p) => {
        const pCopy = Object.assign({}, p)
        delete pCopy.socket
        return pCopy
      })
      response.tournament.participants = participants

      console.log('getTournament response')
      socket.emit('getTournament', response)
    }
  })
}

const broadcastTournament = (client, io, id) => {
  const status = 'failed'
  const response = { id, status }

  // show a tournament
  client.tournaments.show({
    id,
    includeParticipants: 1,
    includeMatches: 1,
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        response.message = err.errors[0]
        io.sockets.in('lobby-' + id).emit('getTournament', response)
        return
      }

      response.status = 'success'
      response.tournament = data.tournament

      let participants = Object.values(processParticipants(id, Object.values(data.tournament.participants)))
      // remove socket, causes issues with serialization
      participants = participants.map((p) => {
        const pCopy = Object.assign({}, p)
        delete pCopy.socket
        return pCopy
      })
      response.tournament.participants = participants

      console.log('broadcast getTournament')
      io.sockets.in('lobby-' + id).emit('getTournament', response)
    }
  })
}

const startTournament = (client, io, id) => {
  const status = 'failed'
  const response = { id, status }

  // start tournament
  client.tournaments.start({
    id,
    includeParticipants: 1,
    includeMatches: 1,
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        response.message = err.errors[0]
        io.sockets.in('lobby-' + id).emit('startTournament', response)
        return
      }

      response.status = 'success'
      response.tournament = data.tournament

      let participants = Object.values(processParticipants(id, Object.values(data.tournament.participants)))
      // remove socket, causes issues with serialization
      participants = participants.map((p) => {
        const pCopy = Object.assign({}, p)
        delete pCopy.socket
        return pCopy
      })
      response.tournament.participants = participants

      console.log('broadcast startTournament to lobby ' + id)
      io.sockets.in('lobby-' + id).emit('startTournament', response)
    }
  })
}

const resetTournament = (client, io, id) => {
  const status = 'failed'
  const response = { id, status }

  // reset tournament
  client.tournaments.reset({
    id,
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        response.message = err.errors[0]
        io.sockets.in('lobby-' + id).emit('resetTournament', response)
        return
      }

      response.status = 'success'
      response.tournament = data.tournament

      console.log('broadcast resetTournament to lobby ' + id)
      io.sockets.in('lobby-' + id).emit('resetTournament', response)
    }
  })
}

const getMatches = (client, socket, id) => {
  const status = 'failed'
  const response = { id, status }

  client.matches.index({
    id,
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        response.message = err.errors[0]
        socket.emit('getMatches', response)
        return
      }

      response.status = 'success'
      response.matches = data

      console.log('getMatches response')
      socket.emit('getMatches', response)
    }
  })
}

const getParticipants = (client, socket, io, id) => {
  const status = 'failed'
  const response = { id, status }

  client.participants.index({
    id,
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        response.message = err.errors[0]
        socket.emit('getParticipants', response)
        return
      }

      let participants = Object.values(processParticipants(id, Object.values(data)))
      // remove socket, causes issues with serialization
      participants = participants.map((p) => {
        const pCopy = Object.assign({}, p)
        delete pCopy.socket
        return pCopy
      })

      response.status = 'success'
      response.participants = participants

      console.log('getParticipants response')
      socket.emit('getParticipants', response)
    }
  })
}

const broadcastParticipants = (client, io, id) => {
  const status = 'failed'
  const response = { id, status }

  client.participants.index({
    id,
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        response.message = err.errors[0]
        io.sockets.in('lobby-' + id).emit('getParticipants', response)
        return
      }

      let participants = Object.values(processParticipants(id, Object.values(data)))
      // remove socket, causes issues with serialization
      participants = participants.map((p) => {
        const pCopy = Object.assign({}, p)
        delete pCopy.socket
        return pCopy
      })

      response.status = 'success'
      response.participants = participants

      console.log('broadcast getParticipants')
      io.sockets.in('lobby-' + id).emit('getParticipants', response)
    }
  })
}

const joinLobby = (socket, io, id) => {
  socket.join('lobby-' + id)
  initStore(id)

  const response = { status: 'success', message: 'You are in lobby ' + id }
  console.log('joinLobby response')
  socket.emit('joinLobby', response)
}

const startGame = (io, id, match) => {
  const game = getGame(id, match)
  const player1Id = game.player1.id
  const player2Id = game.player2.id
  const player1Socket = getSocketById(id, player1Id)
  const player2Socket = getSocketById(id, player2Id)
  const gameRoomId = 'game-' + game.id

  if (!(gameRoomId in io.sockets.adapter.rooms)) {
    player1Socket.join(gameRoomId)
    player2Socket.join(gameRoomId)
  } else {
    if (!(player1Socket.id in io.sockets.adapter.rooms[gameRoomId])) {
      player1Socket.join(gameRoomId)
    }
    if (!(player2Socket.id in io.sockets.adapter.rooms[gameRoomId])) {
      player2Socket.join(gameRoomId)
    }
  }

  player1Socket.emit('joinGame', game)
  player2Socket.emit('joinGame', game)

  initStore(game.id)
  store[game.id] = {
    actions: {
      [player1Id]: null,
      [player2Id]: null
    },
    player1Id,
    player2Id
  }

  // Send this event to everyone in the game.
  console.log('broadcast startedGame to all clients connected to ' + game.id)
  io.sockets.in(gameRoomId).emit('startedGame', { message: 'Started game ' + game.id })
}

const checkIn = (socket, io, id, name) => {
  const valid = validateName(id, name)

  if (!valid) {
    socket.emit('checkIn', { status: 'failed', message: 'The name you entered is taken: ' + name })
    return
  }

  // handle update case (re-claiming a lost connection)
  if (name in store[id]) {
    const user = updateUser(store[id][name], socket)
    addToLobbyStore(id, user)
    socket.emit('checkIn', { status: 'success' })

    // Broadcast new participants to everyone in the lobby.
    broadcastParticipants(client, io, id)
    return
  }

  client.participants.create({
    id,
    participant: {
      name
    },
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        socket.emit('checkIn', { status: 'failed', message: err.errors[0] })
        return
      }

      const user = createUser(data.participant.id, name, socket)
      console.log('create participant', user.id)
      addToLobbyStore(id, user)
      socket.emit('checkIn', { status: 'success' })

      // Broadcast new participants to everyone in the lobby.
      broadcastParticipants(client, io, id)
    }
  })
}

const startMatches = (client, socket, io, id) => {
  const status = 'failed'
  const response = { id, status }

  client.matches.index({
    id,
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        response.message = err.errors[0]
        socket.emit('startMatches', response)
        return
      }

      const matches = Object.values(data)
      matches.forEach((m) => {
        m = m.match
        if (m.state === 'open') {
          console.log('start game ' + m.id)
          startGame(io, id, m)
        }
      })

      response.status = 'success'
      console.log('startMatches response')
      socket.emit('startMatches', response)
    }
  })
}

const throwWeapon = (client, socket, io, id, gameId, weapon) => {
  const playerId = getIdBySocket(id, socket.id)
  store[gameId].actions[playerId] = weapon
  console.log('received weapon ' + weapon + ' for ' + playerId)

  // count "throws"
  const throws = Object.values(store[gameId].actions).reduce((acc, action) => {
    if (action) {
      acc++
    }
    return acc
  }, 0)

  // both players have thrown, resolve match
  if (throws > 1) {
    console.log('resolving match')
    resolveMatch(client, socket, io, id, gameId)
  }
}

const resolveMatch = (client, socket, io, id, gameId) => {
  const player1Id = store[gameId].player1Id
  const player2Id = store[gameId].player2Id

  const player1Move = store[gameId].actions[player1Id]
  const player2Move = store[gameId].actions[player2Id]

  if (player1Move === 'rock') {
    if (player2Move === 'rock') {
      resolveTie(io, id, gameId, player1Id, player2Id)
      return
    }
    if (player2Move === 'scissors' || player2Move === 'lizard') {
      matchResults(client, io, id, gameId, player1Id, '1-0')
    } else {
      matchResults(client, io, id, gameId, player2Id, '0-1')
    }
  } else if (player1Move === 'paper') {
    if (player2Move === 'paper') {
      resolveTie(io, id, gameId, player1Id, player2Id)
      return
    }
    if (player2Move === 'rock' || player2Move === 'spock') {
      matchResults(client, io, id, gameId, player1Id, '1-0')
    } else {
      matchResults(client, io, id, gameId, player2Id, '0-1')
    }
  } else if (player1Move === 'scissors') {
    if (player2Move === 'scissors') {
      resolveTie(io, id, gameId, player1Id, player2Id)
      return
    }
    if (player2Move === 'paper' || player2Move === 'lizard') {
      matchResults(client, io, id, gameId, player1Id, '1-0')
    } else {
      matchResults(client, io, id, gameId, player2Id, '0-1')
    }
  } else if (player1Move === 'spock') {
    if (player2Move === 'spock') {
      resolveTie(io, id, gameId, player1Id, player2Id)
      return
    }
    if (player2Move === 'scissors' || player2Move === 'rock') {
      matchResults(client, io, id, gameId, player1Id, '1-0')
    } else {
      matchResults(client, io, id, gameId, player2Id, '0-1')
    }
  } else if (player1Move === 'lizard') {
    if (player2Move === 'lizard') {
      resolveTie(io, id, gameId, player1Id, player2Id)
      return
    }
    if (player2Move === 'spock' || player2Move === 'paper') {
      matchResults(client, io, id, gameId, player1Id, '1-0')
    } else {
      matchResults(client, io, id, gameId, player2Id, '0-1')
    }
  }
}

const matchResults = (client, io, id, gameId, winnerId, scores) => {
  const status = 'failed'
  const response = { id, status }

  console.log('report match results, winnerId ' + winnerId)

  client.matches.update({
    id,
    matchId: gameId,
    match: {
      scoresCsv: scores,
      winnerId
    },
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        response.message = err.errors[0]
        io.sockets.in('game-' + gameId).emit('matchResults', response)
        return
      }

      response.status = 'success'
      response.game = {
        winnerName: getNameById(id, winnerId)
      }

      console.log('broadcast matchResults to all clients connected to ' + gameId)
      io.sockets.in('game-' + gameId).emit('matchResults', response)
      broadcastTournament(client, io, id)
    }
  })
}

const resolveTie = (io, id, gameId, player1Id, player2Id) => {
  const match = {
    id: gameId,
    player1Id,
    player2Id
  }

  store[gameId] = null

  console.log('broadcast matchTie to all clients connected to ' + gameId)
  io.sockets.in('game-' + gameId).emit('matchTie')
  startGame(io, id, match)
}

const getGame = (id, match) => {
  return {
    id: match.id,
    player1: {
      id: match.player1Id,
      name: getNameById(id, match.player1Id)
    },
    player2: {
      id: match.player2Id,
      name: getNameById(id, match.player2Id)
    }
  }
}

const processParticipants = (id, participants) => {
  participants.forEach((p) => {
    p = p.participant
    if (!(p.name in store[id])) {
      // add "inactive" players to lobby
      const u = createUser(p.id, p.name, null)
      addToLobbyStore(id, u)
    }
  })

  return store[id]
}

const addToLobbyStore = (id, user) => {
  store[id][user.name] = user
}

const validateName = (id, name) => {
  if (!(name in store[id])) {
    return true
  } else {
    const u = store[id][name]
    if (!('socket' in u) || !u.socket) {
      // allow re-claiming names of disconnected players
      return true
    }
  }
  return false
}

const initStore = (id) => {
  if (!(id in store)) {
    store[id] = {}
  }
}

const createUser = (id, name, socket) => {
  return {
    id,
    connected: (!!socket),
    name,
    socket
  }
}

const updateUser = (user, socket) => {
  user.connected = (!!socket)
  user.socket = socket
  return user
}

const getSocketById = (id, playerId) => {
  let socket = null
  Object.values(store[id]).forEach((u) => {
    if (u.id === playerId) {
      socket = u.socket
    }
  })
  return socket
}

const getNameById = (id, playerId) => {
  let name = null
  Object.values(store[id]).forEach((u) => {
    if (u.id === playerId) {
      name = u.name
    }
  })
  return name
}

const getIdBySocket = (id, socketId) => {
  let uid = null
  Object.values(store[id]).forEach((u) => {
    if (u.socket && u.socket.id === socketId) {
      uid = u.id
    }
  })
  return uid
}
