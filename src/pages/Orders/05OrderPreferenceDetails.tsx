import GenericCrudDetails from "./GenericCrudDetails";

export default function OrderPreferenceDetails() {
  return (
    <GenericCrudDetails
      title="Order Preferences"
      breadcrumb="Order Preferences"
      listRoute="/orders/order-preferences"
      apiBasePath="admin-panel/order-preferences"
      enableDelete
    />
  );
}

