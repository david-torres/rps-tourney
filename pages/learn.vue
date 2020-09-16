<template>
  <section class="hero is-medium is-primary">
    <div class="hero-body">
      <div class="container">
        <div class="columns">
          <div class="column is-8-desktop is-offset-2-desktop">
            <h1 class="title is-2 is-spaced">
              How to play
            </h1>
            <h2 class="subtitle is-4">
              Scissors cuts Paper covers Rock crushes Lizard poisons Spock smashes Scissors decapitates Lizard eats Paper disproves Spock vaporizes Rock crushes Scissors.
            </h2>
          </div>
        </div>
      </div>
    </div>
    <div class="content">
      <h2 class="title">
        How to use this app
      </h2>
      <ul>
        <li>
          Create a tournament and be the first to check-in to become the VIP. The VIP has
          special admin controls unavailable to the rest of the players.
        </li>
        <li>Share the link or QR code to your participants.</li>
        <li>
          When there are at least two participants the VIP can click "Begin Tournament"
          to generate matches.
        </li>
        <li>When everyone is ready, the VIP can click "Begin Matches" to start the game.</li>
        <li>As each round completes, the VIP will need to click "Begin Matches" again.</li>
        <li>Keep going until you have a champion!</li>
      </ul>
    </div>
    <div class="content">
      <h2 class="title">
        Troubleshooting
      </h2>
      <ul>
        <li>For the vast majority of cases, refreshing the page should resolve any issues.</li>
        <li>A plug icon next to player's name means that they are disconnected. Refreshing should fix it.</li>
        <li>A player can "reclaim" a checked-in name that is disconnected by entering that name again.</li>
        <li>
          The VIP can open the "Danger Zone" menu and click "Reset Tournament" to revert
          the tournament back to an unstarted state.
        </li>
      </ul>
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

<style></style>
