import GenericCrudList from "./GenericCrudList";

export default function OrderPreferencesAdmin() {
  return (
    <GenericCrudList
      title="Order preferences Admin"
      breadcrumb="Order preferences Admin"
      apiPath="admin-panel/order-preferences-admin/"
      detailsRouteBase="/orders/order-preferences-admin"
      enableCreate
    />
  );
}

