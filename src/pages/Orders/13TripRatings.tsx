import GenericCrudList from "./GenericCrudList";

export default function TripRatings() {
  return (
    <GenericCrudList
      title="Trip Ratings"
      breadcrumb="Trip Ratings"
      apiPath="admin-panel/trip-ratings/"
      detailsRouteBase="/orders/trip-ratings"
      enableCreate
    />
  );
}

