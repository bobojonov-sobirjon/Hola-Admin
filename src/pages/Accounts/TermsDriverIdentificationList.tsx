import ActiveTypesList from "./ActiveTypesList";

export default function TermsDriverIdentificationList() {
  return (
    <ActiveTypesList
      title="Terms — driver identification"
      breadcrumb="Terms — driver identification (T&C)"
      listPath="admin-panel/terms-driver-identification/"
      detailsBasePath="/site-settings/terms-driver-ids"
      deleteEntityLabel="terms identification type"
    />
  );
}

