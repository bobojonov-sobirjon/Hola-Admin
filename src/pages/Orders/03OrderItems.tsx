import GenericCrudList from "./GenericCrudList";

export default function OrderItems() {
  return (
    <GenericCrudList
      title="Order Items"
      breadcrumb="Order Items"
      apiPath="admin-panel/order-items/"
      detailsRouteBase="/orders/order-items"
      enableCreate
    />
  );
}

