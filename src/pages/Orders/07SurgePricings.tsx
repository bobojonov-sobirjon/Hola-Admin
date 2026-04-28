import GenericCrudList from "./GenericCrudList";

export default function SurgePricings() {
  return (
    <GenericCrudList
      title="Surge Pricings"
      breadcrumb="Surge Pricings"
      apiPath="admin-panel/surge-pricings/"
      detailsRouteBase="/orders/surge-pricings"
      createInitialJson={{
        name: "Rush hour",
        multiplier: "1.50",
        start_time: "17:00:00",
        end_time: "20:00:00",
        days_of_week: [0, 1, 2, 3, 4],
        zone_name: "Downtown",
        latitude: "39.8046579",
        longitude: "64.4263534",
        radius_km: "5.0",
        min_available_drivers: 1,
        max_available_drivers: 3,
        priority: 10,
        is_active: true,
      }}
      createFields={[
        { key: "name", label: "Name", type: "text" },
        { key: "multiplier", label: "Multiplier", type: "text" },
        { key: "start_time", label: "Start time", type: "time" },
        { key: "end_time", label: "End time", type: "time" },
        {
          key: "days_of_week",
          label: "Days of week",
          type: "array-number",
          placeholder: "0,1,2,3,4",
          hint: "Example: 0,1,2,3,4",
        },
        { key: "zone_name", label: "Zone name", type: "text" },
        { key: "latitude", label: "Latitude", type: "text" },
        { key: "longitude", label: "Longitude", type: "text" },
        { key: "radius_km", label: "Radius (km)", type: "text" },
        { key: "min_available_drivers", label: "Min available drivers", type: "number" },
        { key: "max_available_drivers", label: "Max available drivers", type: "number" },
        { key: "priority", label: "Priority", type: "number" },
        { key: "is_active", label: "Active", type: "checkbox" },
      ]}
      enableCreate
    />
  );
}

