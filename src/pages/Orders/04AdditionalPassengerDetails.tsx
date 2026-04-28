import GenericCrudDetails from "./GenericCrudDetails";

export default function AdditionalPassengerDetails() {
  return (
    <GenericCrudDetails
      title="Additional Passenger"
      breadcrumb="Additional Passenger"
      listRoute="/orders/additional-passengers"
      apiBasePath="admin-panel/additional-passengers"
      enableDelete
    />
  );
}

