import ActiveTypesList from "./ActiveTypesList";

export default function LegalDriverIdentificationList() {
  return (
    <ActiveTypesList
      title="Legal — driver identification"
      breadcrumb="Legal — driver identification"
      listPath="admin-panel/legal-driver-identification/"
      detailsBasePath="/accounts/legal-driver-ids"
    />
  );
}

