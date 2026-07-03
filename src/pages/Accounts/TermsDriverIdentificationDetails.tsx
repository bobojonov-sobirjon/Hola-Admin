import ActiveTypeDetails from "./ActiveTypeDetails";

export default function TermsDriverIdentificationDetails() {
  return (
    <ActiveTypeDetails
      title="Terms — driver identification"
      breadcrumb="Terms — driver identification (T&C)"
      listRoute="/site-settings/terms-driver-ids"
      apiBasePath="admin-panel/terms-driver-identification"
      deleteEntityLabel="terms identification type"
    />
  );
}

