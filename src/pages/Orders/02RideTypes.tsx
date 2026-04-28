import GenericCrudList from "./GenericCrudList";
import Badge from "../../components/ui/badge/Badge";
import { formatDate } from "./OrdersAdminCommon";

export default function RideTypes() {
  return (
    <GenericCrudList
      title="Ride Types"
      breadcrumb="Ride Types"
      apiPath="admin-panel/ride-types/"
      detailsRouteBase="/orders/ride-types"
      addLabel="Add Ride Type"
      createInitialJson={{
        name: "Hola",
        name_large: "Hola Standard",
        base_price: "3.00",
        price_per_km: "1.50",
        capacity: 4,
        icon: "car",
        is_premium: false,
        is_ev: false,
        is_active: true,
      }}
      createFields={[
        { key: "name", label: "Name", type: "text" },
        { key: "name_large", label: "Name large", type: "text" },
        { key: "base_price", label: "Base price", type: "text" },
        { key: "price_per_km", label: "Price per KM", type: "text" },
        { key: "capacity", label: "Capacity", type: "number" },
        { key: "icon", label: "Icon", type: "text" },
        { key: "is_premium", label: "Premium", type: "checkbox" },
        { key: "is_ev", label: "EV", type: "checkbox" },
        { key: "is_active", label: "Active", type: "checkbox" },
      ]}
      columns={[
        { header: "Name", render: (it) => (it.name as string) ?? "-" },
        { header: "Name large", render: (it) => (it.name_large as string) ?? "-" },
        { header: "Base price", render: (it) => String((it.base_price as any) ?? "-") },
        { header: "Price per KM", render: (it) => String((it.price_per_km as any) ?? "-") },
        { header: "Capacity", render: (it) => String((it.capacity as any) ?? "-") },
        {
          header: "is_premium",
          render: (it) => (
            <Badge size="sm" color={it.is_premium ? "success" : "error"}>
              {it.is_premium ? "Yes" : "No"}
            </Badge>
          ),
        },
        {
          header: "is_ev",
          render: (it) => (
            <Badge size="sm" color={it.is_ev ? "success" : "error"}>
              {it.is_ev ? "Yes" : "No"}
            </Badge>
          ),
        },
        {
          header: "is_active",
          render: (it) => (
            <Badge size="sm" color={it.is_active ? "success" : "error"}>
              {it.is_active ? "Yes" : "No"}
            </Badge>
          ),
        },
        { header: "Created at", render: (it) => formatDate((it.created_at as any) ?? null) },
      ]}
      enableCreate
    />
  );
}

