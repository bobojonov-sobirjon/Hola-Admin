import GenericCrudDetails from "./GenericCrudDetails";

export default function PromoCodeDetails() {
  return (
    <GenericCrudDetails
      title="Promo Code"
      breadcrumb="Promo Code"
      listRoute="/orders/promo-codes"
      apiBasePath="admin-panel/promo-codes"
      enableDelete
    />
  );
}

