import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import RoomView from "@/views/RoomView.vue";
import ConsultRoomView from "@/views/ConsultRoomView.vue";
import HistoryView from "@/views/HistoryView.vue";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  strict: true,
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { title: "嘉虹健康医生端首页" }
    },
    {
      path: "/room",
      redirect: "/room/"
    },
    {
      path: "/room/",
      name: "room",
      component: RoomView,
      meta: { title: "嘉虹健康问诊室" }
    },
    {
      path: "/text",
      redirect: "/text/"
    },
    {
      path: "/text/",
      name: "text",
      component: ConsultRoomView,
      props: { mode: "text" },
      meta: { title: "嘉虹健康图文问诊" }
    },
    {
      path: "/video",
      redirect: "/video/"
    },
    {
      path: "/video/",
      name: "video",
      component: ConsultRoomView,
      props: { mode: "video" },
      meta: { title: "嘉虹健康视频问诊" }
    },
    {
      path: "/history",
      redirect: "/history/"
    },
    {
      path: "/history/",
      name: "history",
      component: HistoryView,
      meta: { title: "嘉虹健康开方历史" }
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/"
    }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});

router.afterEach((to) => {
  document.title = to.meta.title || "嘉虹健康医生端";
});
