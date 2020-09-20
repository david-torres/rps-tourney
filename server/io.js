const challonge = require('challonge')
const shortid = require('shortid')

const store = {}

shortid.characters(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-'
)

// create an instance of the challonge client
const client = challonge.createClient({
  apiKey: process.env.challonge_api_key || ''
})

export default function (socket, io) {
  return Object.freeze({
    disconnect () {
      console.log('a client disconnected')
      disconnect(client, socket, io)
    },
    newTournament () {
      console.log('a client requested a new tournament')
      createTournament(client, socket, io)
    },
    getTournament (data) {
      const id = data.id
      console.log('a client requested tournament ' + id)
      getTournament(client, socket, io, id)
    },
    startTournament (data) {
      const id = data.id
      console.log('a client requested to begin tournament ' + id)
      startTournament(client, socket, io, id)
    },
    resetTournament (data) {
      const id = data.id
      console.log('a client requested to reset tournament ' + id)
      resetTournament(client, socket, io, id)
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
    dropPlayer (data) {
      const id = data.id
      const playerId = data.playerId
      console.log('a client requested to drop player ' + playerId + ' from lobby ' + id)
      dropPlayer(client, socket, io, id, playerId)
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

const getId = () => shortid.generate().replace('-', '_')

const disconnect = (client, socket, io) => {
  socket.removeAllListeners()

  // disconnect game
  for (const id of Object.keys(store)) {
    const data = store[id]
    if ('actions' in data) {
      // unmark any active games
      const playerId = getIdBySocket(data.tid, socket.id)
      if (data.player1Id === playerId || data.player2Id === playerId) {
        console.log('disconnect ' + playerId + ' from game')
        unmarkMatch(client, io, data.tid, id, playerId)
      }
    }
  }

  // disconnect lobby
  for (const id of Object.keys(store)) {
    const data = store[id]
    const name = getNameBySocket(id, socket.id)
    if (name in data) {
      const u = data[name]
      if (u.socket) {
        if (u.socket.id === socket.id) {
          console.log('disconnect ' + name + ' from lobby', id)
          updateUser(u, null)

          // broadcast updated participant list to clients
          broadcastParticipants(client, io, id)
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
      name: 'RPS Tourney (' + id + ')',
      url: id,
      tournamentType: 'single elimination',
      description:
        'RPS Tourney (' + id + '). Single Elimination.',
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

const startTournament = (client, socket, io, id) => {
  const status = 'failed'
  const response = { id, status }

  if (!allPlayersConnected(id)) {
    response.message = 'You cannot start the tournament with disconnected players'
    socket.emit('startTournament', response)
    return
  }

  // start tournament
  client.tournaments.start({
    id,
    includeParticipants: 1,
    includeMatches: 1,
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        response.message = err.errors[0]
        console.log('emit startTournament error, disconnected players')
        socket.emit('startTournament', response)
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

const resetTournament = (client, socket, io, id) => {
  const status = 'failed'
  const response = { id, status }

  // reset tournament
  client.tournaments.reset({
    id,
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        response.message = err.errors[0]
        socket.emit('resetTournament', response)
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

const startGame = (client, io, id, match) => {
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

  initStore(game.id)
  store[game.id] = {
    tid: id,
    actions: {
      [player1Id]: null,
      [player2Id]: null
    },
    player1Id,
    player2Id
  }

  const status = 'failed'
  const response = { id, status }

  client.client.makeRequest({
    method: 'POST',
    path: '/' + id + '/matches/' + game.id + '/mark_as_underway',
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        console.log('mark request error', err)
        response.message = err.errors[0]
        io.sockets.in(gameRoomId).emit('startedGame', response)
        return
      }

      response.status = 'success'
      response.message = 'Started game ' + game.id

      player1Socket.emit('joinGame', game)
      player2Socket.emit('joinGame', game)

      // Send this event to everyone in the game.
      console.log('broadcast startedGame to all clients connected to ' + game.id)
      io.sockets.in(gameRoomId).emit('startedGame', response)
    }
  })
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

  // first player to check-in becomes VIP
  let vip = false
  if (Object.values(store[id]).length === 0) {
    vip = true
  }

  client.participants.create({
    id,
    participant: {
      name,
      misc: (vip ? 'vip' : '')
    },
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        socket.emit('checkIn', { status: 'failed', message: err.errors[0] })
        return
      }

      const user = createUser(data.participant.id, name, socket, data.participant.misc)
      console.log('create participant', user.id)
      addToLobbyStore(id, user)
      socket.emit('checkIn', { status: 'success' })

      // Broadcast new participants to everyone in the lobby.
      broadcastParticipants(client, io, id)
    }
  })
}

const dropPlayer = (client, socket, io, id, playerId) => {
  client.participants.destroy({
    id,
    participantId: playerId,
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        socket.emit('dropPlayer', { status: 'failed', message: err.errors[0] })
        return
      }

      const name = getNameById(id, playerId)
      const user = store[id][name]

      if (user && user.connected) {
        io.sockets.sockets[user.socket.id].disconnect()
      }

      delete store[id][name]
      socket.emit('dropPlayer', { status: 'success', player: name })

      // Broadcast updated participants to everyone in the lobby.
      broadcastParticipants(client, io, id)
    }
  })
}

const startMatches = (client, socket, io, id) => {
  const status = 'failed'
  const response = { id, status }

  if (!allPlayersConnected(id)) {
    response.message = 'You cannot start matches with disconnected players'
    console.log('emit startMatches error, disconnected players')
    socket.emit('startMatches', response)
    return
  }

  client.matches.index({
    id,
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        response.message = err.errors[0]
        console.log('emit startMatches error', err.errors[0])
        socket.emit('startMatches', response)
        return
      }

      const matches = Object.values(data)
      let matchCount = 0
      matches.forEach((m) => {
        m = m.match
        if (m.state === 'open' && !m.underwayAt) {
          console.log('start game ' + m.id)
          startGame(client, io, id, m)
          matchCount++
        }
      })

      response.status = 'success'
      response.count = matchCount
      console.log('startMatches response', matchCount)
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
      resolveTie(client, io, id, gameId, player1Id, player2Id)
      return
    }
    if (player2Move === 'scissors' || player2Move === 'lizard') {
      matchResults(client, io, id, gameId, player1Id, '1-0')
    } else {
      matchResults(client, io, id, gameId, player2Id, '0-1')
    }
  } else if (player1Move === 'paper') {
    if (player2Move === 'paper') {
      resolveTie(client, io, id, gameId, player1Id, player2Id)
      return
    }
    if (player2Move === 'rock' || player2Move === 'spock') {
      matchResults(client, io, id, gameId, player1Id, '1-0')
    } else {
      matchResults(client, io, id, gameId, player2Id, '0-1')
    }
  } else if (player1Move === 'scissors') {
    if (player2Move === 'scissors') {
      resolveTie(client, io, id, gameId, player1Id, player2Id)
      return
    }
    if (player2Move === 'paper' || player2Move === 'lizard') {
      matchResults(client, io, id, gameId, player1Id, '1-0')
    } else {
      matchResults(client, io, id, gameId, player2Id, '0-1')
    }
  } else if (player1Move === 'spock') {
    if (player2Move === 'spock') {
      resolveTie(client, io, id, gameId, player1Id, player2Id)
      return
    }
    if (player2Move === 'scissors' || player2Move === 'rock') {
      matchResults(client, io, id, gameId, player1Id, '1-0')
    } else {
      matchResults(client, io, id, gameId, player2Id, '0-1')
    }
  } else if (player1Move === 'lizard') {
    if (player2Move === 'lizard') {
      resolveTie(client, io, id, gameId, player1Id, player2Id)
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

      // post match results to game room
      console.log('broadcast matchResults to all clients connected to ' + gameId)
      io.sockets.in('game-' + gameId).emit('matchResults', response)

      // leave the game room
      io.in('game-' + gameId).clients((error, socketIds) => {
        if (error) { return }
        socketIds.forEach(socketId => io.sockets.sockets[socketId].leave('game-' + gameId))
      })

      // clear the game cache
      delete store[gameId]

      // send tournament broadcast
      broadcastTournament(client, io, id)
    }
  })
}

const resolveTie = (client, io, id, gameId, player1Id, player2Id) => {
  const match = {
    id: gameId,
    player1Id,
    player2Id
  }

  store[gameId] = null

  console.log('broadcast matchTie to all clients connected to ' + gameId)
  io.sockets.in('game-' + gameId).emit('matchTie')
  startGame(client, io, id, match)
}

const unmarkMatch = (client, io, id, gameId, droppedPlayerId) => {
  const status = 'failed'
  const response = { id, status }

  const droppedPlayerName = getNameById(id, droppedPlayerId)

  const vip = getVIP(id)
  let vipConnected = false
  if (vip.connected && vip.id !== droppedPlayerId) {
    vipConnected = true
  }
  console.log('umark match', id, gameId, droppedPlayerId)
  console.log('path', '/' + id + '/matches/' + gameId + '/unmark_as_underway')
  client.client.makeRequest({
    method: 'POST',
    path: '/' + id + '/matches/' + gameId + '/unmark_as_underway',
    callback: (err, data) => {
      // console.log(err, data)
      if (err) {
        console.log('unmark request error', err)
        response.message = err.errors[0]
        if (vipConnected) {
          vip.socket.emit('droppedGame', response)
        }
        return
      }

      response.status = 'success'
      response.message = 'Unmarked game ' + gameId
      response.player = droppedPlayerName

      // send this event to the opponent
      const match = data.match
      let opponentId = null
      if (match.player1Id === droppedPlayerId) {
        opponentId = match.player2Id
      } else {
        opponentId = match.player1Id
      }
      const opponentSocket = getSocketById(id, opponentId)
      opponentSocket.emit('cancelGame', response)

      // send this event to the VIP of the tournament
      if (vipConnected) {
        console.log('emit droppedGame to VIP of ' + id)
        vip.socket.emit('droppedGame', response)
      }
    }
  })
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
      const u = createUser(p.id, p.name, null, p.misc)
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

const cleanStore = () => {
  Object.keys(store).forEach((key) => {
    const tournament = store[key]

    let disconnectedCount = 0
    Object.keys(tournament).forEach((name) => {
      const player = tournament[name]
      if (player.connected === false) {
        disconnectedCount += 1
      }
    })

    if (disconnectedCount === Object.keys(tournament).length) {
      console.log('clearing store ' + key)
      delete store[key]
    }
  })
}

const createUser = (id, name, socket, misc) => {
  const vip = (misc === 'vip')
  return {
    id,
    connected: (!!socket),
    name,
    socket,
    vip
  }
}

const updateUser = (user, socket) => {
  user.connected = (!!socket)
  user.socket = socket
  return user
}

const allPlayersConnected = (id) => {
  let anyDisconnected = false
  Object.values(store[id]).forEach((p) => {
    if (p.connected === false) {
      anyDisconnected = true
    }
  })
  return !anyDisconnected
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

const getNameBySocket = (id, socketId) => {
  let name = null
  Object.values(store[id]).forEach((u) => {
    if (u.socket && u.socket.id === socketId) {
      name = u.name
    }
  })
  return name
}

const getVIP = (id) => {
  let vip = null
  Object.values(store[id]).forEach((u) => {
    if (u.vip) {
      vip = u
    }
  })
  return vip
}

// long-running processes
setInterval(cleanStore, 600000)
// TODO: cleanup old tournaments
