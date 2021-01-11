import Vue from 'vue'
import VueRouter from 'vue-router'
import DiagramComponent from "@/components/DiagramComponent.vue";

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Diagram',
    component: DiagramComponent
  },
  {
    path: '/about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
