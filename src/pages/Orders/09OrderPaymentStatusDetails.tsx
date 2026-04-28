import GenericCrudDetails from "./GenericCrudDetails";

export default function OrderPaymentStatusDetails() {
  return (
    <GenericCrudDetails
      title="Payment Split"
      breadcrumb="Order Payment Status"
      listRoute="/orders/order-payment-status"
      apiBasePath="admin-panel/order-payment-status"
      enableDelete
    />
  );
}

