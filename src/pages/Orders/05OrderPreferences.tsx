import GenericCrudList from "./GenericCrudList";

export default function OrderPreferences() {
  return (
    <GenericCrudList
      title="Order Preferences"
      breadcrumb="Order Preferences"
      apiPath="admin-panel/order-preferences/"
      detailsRouteBase="/orders/order-preferences"
      enableCreate
    />
  );
}

