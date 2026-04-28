import GenericCrudList from "./GenericCrudList";

export default function PromoCodes() {
  return (
    <GenericCrudList
      title="Promo Codes"
      breadcrumb="Promo Codes"
      apiPath="admin-panel/promo-codes/"
      detailsRouteBase="/orders/promo-codes"
      enableCreate
    />
  );
}

