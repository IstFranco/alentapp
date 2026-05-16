import { createBrowserRouter } from "react-router";

import { MembersView } from "./views/Members";
import { HomeView } from "./views/Home";
import { LockersView } from "./views/Lockers"; // ¡Tu nueva vista importada!
import Layout from "./Layout";

export let router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        path: "/",
        Component: HomeView,
      },
      {
        path: "/members",
        Component: MembersView,
      },
      {
        path: "/lockers", // ¡Tu nueva ruta declarada!
        Component: LockersView,
      },
    ],
  },
]);
