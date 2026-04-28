import GenericCrudDetails from "./GenericCrudDetails";

export default function RideTypeDetails() {
  return (
    <GenericCrudDetails
      title="Ride Type"
      breadcrumb="Ride Type"
      listRoute="/orders/ride-types"
      apiBasePath="admin-panel/ride-types"
      enableDelete
    />
  );
}

