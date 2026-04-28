import GenericCrudDetails from "./GenericCrudDetails";

export default function TripRatingDetails() {
  return (
    <GenericCrudDetails
      title="Trip Rating"
      breadcrumb="Trip Rating"
      listRoute="/orders/trip-ratings"
      apiBasePath="admin-panel/trip-ratings"
      enableDelete
    />
  );
}

