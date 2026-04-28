import GenericCrudDetails from "./GenericCrudDetails";

export default function OrderItemDetails() {
  return (
    <GenericCrudDetails
      title="Order Item"
      breadcrumb="Order Item"
      listRoute="/orders/order-items"
      apiBasePath="admin-panel/order-items"
      enableDelete
    />
  );
}

