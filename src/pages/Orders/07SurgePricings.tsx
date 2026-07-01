import GenericCrudList from "./GenericCrudList";
import {
  SURGE_CREATE_INITIAL,
  SURGE_FORM_FIELDS,
} from "./surgePricingFields";
import { formatRadiusMilesDisplay } from "../../utils/surgeRadiusUtils";

export default function SurgePricings() {
  return (
    <GenericCrudList
      title="Surge Pricings"
      breadcrumb="Surge Pricings"
      apiPath="admin-panel/surge-pricings/"
      detailsRouteBase="/orders/surge-pricings"
      createInitialJson={SURGE_CREATE_INITIAL}
      createFields={SURGE_FORM_FIELDS}
      columns={[
        { header: "Name", render: (it) => String(it.name ?? "—") },
        { header: "Zone", render: (it) => String(it.zone_name ?? "—") },
        {
          header: "Multiplier",
          render: (it) => (it.multiplier != null ? String(it.multiplier) : "—"),
        },
        {
          header: "Radius",
          render: (it) =>
            it.radius_km != null ? formatRadiusMilesDisplay(String(it.radius_km)) : "—",
        },
        {
          header: "Active",
          render: (it) =>
            typeof it.is_active === "boolean" ? (it.is_active ? "Yes" : "No") : "—",
        },
      ]}
      enableCreate
    />
  );
}
