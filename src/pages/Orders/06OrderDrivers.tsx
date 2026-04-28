import GenericCrudList from "./GenericCrudList";

export default function OrderDrivers() {
  return (
    <GenericCrudList
      title="Order Drivers"
      breadcrumb="Order Drivers"
      apiPath="admin-panel/order-drivers/"
      detailsRouteBase="/orders/order-drivers"
      enableCreate
    />
  );
}

