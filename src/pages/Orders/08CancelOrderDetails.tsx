import GenericCrudDetails from "./GenericCrudDetails";

export default function CancelOrderDetails() {
  return (
    <GenericCrudDetails
      title="Cancel Order"
      breadcrumb="Cancel Order"
      listRoute="/orders/cancel-orders"
      apiBasePath="admin-panel/cancel-orders"
      enableDelete
    />
  );
}

