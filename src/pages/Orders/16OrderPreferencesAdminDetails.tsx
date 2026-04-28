import GenericCrudDetails from "./GenericCrudDetails";

export default function OrderPreferencesAdminDetails() {
  return (
    <GenericCrudDetails
      title="Order preferences Admin"
      breadcrumb="Order preferences Admin"
      listRoute="/orders/order-preferences-admin"
      apiBasePath="admin-panel/order-preferences-admin"
      enableDelete
    />
  );
}

