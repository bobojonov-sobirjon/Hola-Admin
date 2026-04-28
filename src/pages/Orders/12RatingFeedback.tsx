import GenericCrudList from "./GenericCrudList";

export default function RatingFeedback() {
  return (
    <GenericCrudList
      title="Rating Feedback"
      breadcrumb="Rating Feedback"
      apiPath="admin-panel/rating-feedback/"
      detailsRouteBase="/orders/rating-feedback"
      createInitialJson={{
        name: "Professional",
        tag_type: "positive",
        rating_target: "rider_to_driver",
        is_active: true,
      }}
      createFields={[
        { key: "name", label: "Name", type: "text" },
        {
          key: "tag_type",
          label: "Tag type",
          type: "select",
          options: [
            { value: "positive", label: "positive" },
            { value: "negative", label: "negative" },
          ],
        },
        {
          key: "rating_target",
          label: "Rating target",
          type: "select",
          options: [
            { value: "rider_to_driver", label: "rider_to_driver" },
            { value: "driver_to_rider", label: "driver_to_rider" },
          ],
        },
        { key: "is_active", label: "Active", type: "checkbox" },
      ]}
      enableCreate
    />
  );
}

