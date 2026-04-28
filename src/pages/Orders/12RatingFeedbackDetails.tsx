import GenericCrudDetails from "./GenericCrudDetails";

export default function RatingFeedbackDetails() {
  return (
    <GenericCrudDetails
      title="Rating Feedback Tag"
      breadcrumb="Rating Feedback"
      listRoute="/orders/rating-feedback"
      apiBasePath="admin-panel/rating-feedback"
      enableDelete
    />
  );
}

