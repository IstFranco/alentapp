import { createBrowserRouter } from "react-router";

import { MembersView } from "./views/Members";
import { HomeView } from "./views/Home";
import { EquipmentLoansView } from "./views/EquipmentLoans";
import { LockersView } from "./views/Lockers";
import { MedicalCertificatesView } from "./views/MedicalCertificates";
import { SportsView } from "./views/Sports";
import Layout from "./Layout";

export const router = createBrowserRouter([
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
        path: "/equipment-loans",
        Component: EquipmentLoansView,
      },
      {
        path: "/lockers",
        Component: LockersView,
      },
      {
        path: "/medical-certificates",
        Component: MedicalCertificatesView,
      },
      {
        path: "/sports",
        Component: SportsView,
      },
    ],
  },
]);