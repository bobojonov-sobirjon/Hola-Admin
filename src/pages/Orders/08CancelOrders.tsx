import GenericCrudList from "./GenericCrudList";

export default function CancelOrders() {
  return (
    <GenericCrudList
      title="Cancel Orders"
      breadcrumb="Cancel Orders"
      apiPath="admin-panel/cancel-orders/"
      detailsRouteBase="/orders/cancel-orders"
      enableCreate
    />
  );
}

