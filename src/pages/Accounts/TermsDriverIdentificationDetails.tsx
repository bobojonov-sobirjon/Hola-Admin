import ActiveTypeDetails from "./ActiveTypeDetails";

export default function TermsDriverIdentificationDetails() {
  return (
    <ActiveTypeDetails
      title="Terms — driver identification"
      breadcrumb="Terms — driver identification (T&C)"
      listRoute="/accounts/terms-driver-ids"
      apiBasePath="admin-panel/terms-driver-identification"
    />
  );
}

