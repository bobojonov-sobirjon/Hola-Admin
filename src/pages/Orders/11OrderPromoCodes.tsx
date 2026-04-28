import GenericCrudList from "./GenericCrudList";

export default function OrderPromoCodes() {
  return (
    <GenericCrudList
      title="Order Promo Codes"
      breadcrumb="Order Promo Codes"
      apiPath="admin-panel/order-promo-codes/"
      detailsRouteBase="/orders/order-promo-codes"
      enableCreate
    />
  );
}

