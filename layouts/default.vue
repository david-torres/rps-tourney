<template>
  <div class="container">
    <b-navbar>
      <template slot="brand">
        <b-navbar-item tag="router-link" :to="{ path: '/' }">
          <h1 class="title">
            RPS Tourney
          </h1>
        </b-navbar-item>
      </template>
      <template slot="start">
        <b-navbar-item href="/">
          Home
        </b-navbar-item>
        <b-navbar-item href="/learn">
          Learn
        </b-navbar-item>
      </template>
    </b-navbar>
    <hr>
    <nuxt />
  </div>
</template>
