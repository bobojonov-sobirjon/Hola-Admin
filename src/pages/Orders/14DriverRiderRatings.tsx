import GenericCrudList from "./GenericCrudList";

export default function DriverRiderRatings() {
  return (
    <GenericCrudList
      title="Driver Rider Ratings"
      breadcrumb="Driver Rider Ratings"
      apiPath="admin-panel/driver-rider-ratings/"
      detailsRouteBase="/orders/driver-rider-ratings"
      enableCreate
    />
  );
}

