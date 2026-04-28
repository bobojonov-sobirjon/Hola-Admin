import GenericCrudDetails from "./GenericCrudDetails";

export default function DriverRiderRatingDetails() {
  return (
    <GenericCrudDetails
      title="Driver Rider Rating"
      breadcrumb="Driver Rider Rating"
      listRoute="/orders/driver-rider-ratings"
      apiBasePath="admin-panel/driver-rider-ratings"
      enableDelete
    />
  );
}

