import GenericCrudDetails from "./GenericCrudDetails";

export default function SurgePricingDetails() {
  return (
    <GenericCrudDetails
      title="Surge Pricing"
      breadcrumb="Surge Pricing"
      listRoute="/orders/surge-pricings"
      apiBasePath="admin-panel/surge-pricings"
      enableDelete
    />
  );
}

