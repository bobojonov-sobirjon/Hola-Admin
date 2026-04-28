import GenericCrudDetails from "./GenericCrudDetails";

export default function OrderPromoCodeDetails() {
  return (
    <GenericCrudDetails
      title="Order Promo Code"
      breadcrumb="Order Promo Code"
      listRoute="/orders/order-promo-codes"
      apiBasePath="admin-panel/order-promo-codes"
      enableDelete
    />
  );
}

