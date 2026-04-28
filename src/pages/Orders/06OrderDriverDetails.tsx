import GenericCrudDetails from "./GenericCrudDetails";

export default function OrderDriverDetails() {
  return (
    <GenericCrudDetails
      title="Order Driver"
      breadcrumb="Order Driver"
      listRoute="/orders/order-drivers"
      apiBasePath="admin-panel/order-drivers"
      enableDelete
    />
  );
}

