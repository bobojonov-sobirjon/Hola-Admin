import GenericCrudList from "./GenericCrudList";

export default function OrderPaymentStatus() {
  return (
    <GenericCrudList
      title="Order Payment Status"
      breadcrumb="Order Payment Status"
      apiPath="admin-panel/order-payment-status/"
      detailsRouteBase="/orders/order-payment-status"
      enableCreate
    />
  );
}

