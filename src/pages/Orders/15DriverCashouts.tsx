import GenericCrudList from "./GenericCrudList";

export default function DriverCashouts() {
  return (
    <GenericCrudList
      title="Driver Cashouts"
      breadcrumb="Driver Cashouts"
      apiPath="admin-panel/driver-cashouts/"
      detailsRouteBase="/orders/driver-cashouts"
      enableCreate
    />
  );
}

