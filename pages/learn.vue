<template>
  <section>
    <div class="hero is-small is-primary">
      <div class="hero-body">
        <div class="container">
          <div class="columns">
            <div class="column is-8-desktop is-offset-2-desktop">
              <h1 class="title is-2 is-spaced">
                How to play
              </h1>
              <h2 class="subtitle is-4">
                <strong>Scissors</strong> cuts <strong>Paper</strong> covers <strong>Rock</strong> crushes <strong>Lizard</strong> poisons <strong>Spock</strong> smashes <strong>Scissors</strong> decapitates <strong>Lizard</strong> eats <strong>Paper</strong> disproves <strong>Spock</strong> vaporizes <strong>Rock</strong> crushes <strong>Scissors</strong>
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="content">
        <h2 class="title">
          How to use this app
        </h2>
        <ul class="list">
          <li class="list-item">
            Create a tournament and be the first to check-in to become the VIP <b-icon
              pack="fas"
              icon="user-cog"
              size="is-small"
            />. The VIP has special admin controls unavailable to the rest of the players.
          </li>
          <li class="list-item">
            Share the link and/or QR code <b-icon
              pack="fas"
              icon="qrcode"
              size="is-small"
            /> with your participants.
          </li>
          <li class="list-item">
            When there are at least two participants the VIP can click "Begin Tournament" <b-icon
              pack="fas"
              icon="play-circle"
              size="is-small"
            />
            to generate matches. No more participants can be added once the tournament has begun.
          </li>
          <li class="list-item">
            When everyone is ready, the VIP can click "Begin Matches" to start the game.
          </li>
          <li class="list-item">
            As each round completes, the VIP will need to click "Begin Matches" again to start the next round.
          </li>
          <li class="list-item">
            Keep going until you have a champion! <b-icon
              pack="fas"
              icon="crown"
              size="is-small"
            />
          </li>
        </ul>
      </div>
      <div class="content">
        <h2 class="title">
          Troubleshooting
        </h2>
        <ul class="list">
          <li class="list-item">
            For the vast majority of cases, refreshing <b-icon
              pack="fas"
              icon="redo"
              size="is-small"
            /> the page should resolve any issues.
          </li>
          <li class="list-item">
            A plug icon <b-icon
              pack="fas"
              icon="plug"
              size="is-small"
            /> next to a player's name means that they are disconnected. Refreshing should fix it.
          </li>
          <li class="list-item">
            A player can "reclaim" <b-icon
              pack="fas"
              icon="recycle"
              size="is-small"
            /> a checked-in name that is disconnected by entering that name again.
          </li>
          <li class="list-item">
            The VIP can open the "Danger Zone" <b-icon
              pack="fas"
              icon="exclamation-triangle"
              size="is-small"
            /> menu and click "Reset Tournament" to revert
            the tournament back to an unstarted state.
          </li>
          <li class="list-item">
            The VIP can hover over a player's name in the Participants list to drop them from the tournament.
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>

export default {
  name: 'Learn',
  components: { },
  mounted () {
  },
  methods: {
  }
}
</script>

<style>
  li .icon {
    text-align: center;
    vertical-align: middle;
    margin-right: 2px;
  }
</style>
