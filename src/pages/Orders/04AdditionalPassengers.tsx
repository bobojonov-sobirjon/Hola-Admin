import GenericCrudList from "./GenericCrudList";

export default function AdditionalPassengers() {
  return (
    <GenericCrudList
      title="Additional Passengers"
      breadcrumb="Additional Passengers"
      apiPath="admin-panel/additional-passengers/"
      detailsRouteBase="/orders/additional-passengers"
      enableCreate
    />
  );
}

