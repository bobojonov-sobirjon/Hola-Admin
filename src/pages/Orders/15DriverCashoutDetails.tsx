import GenericCrudDetails from "./GenericCrudDetails";

export default function DriverCashoutDetails() {
  return (
    <GenericCrudDetails
      title="Driver Cashout"
      breadcrumb="Driver Cashout"
      listRoute="/orders/driver-cashouts"
      apiBasePath="admin-panel/driver-cashouts"
      enableDelete
    />
  );
}

