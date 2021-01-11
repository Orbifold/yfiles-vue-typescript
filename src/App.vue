<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Diagram</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view />
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
.yfiles-handle-resize-template {
  fill: currentColor; /* Use SVG currentColor to allow different colors for individual handles*/
  stroke: currentColor; /* Use SVG currentColor to allow different colors for individual handles*/
}
.yfiles-handle {
  color: #2eae0d;
  margin: 10px;
}
</style>
