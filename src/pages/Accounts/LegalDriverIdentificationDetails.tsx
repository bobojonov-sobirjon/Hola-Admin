import ActiveTypeDetails from "./ActiveTypeDetails";

export default function LegalDriverIdentificationDetails() {
  return (
    <ActiveTypeDetails
      title="Legal — driver identification"
      breadcrumb="Legal — driver identification"
      listRoute="/accounts/legal-driver-ids"
      apiBasePath="admin-panel/legal-driver-identification"
    />
  );
}

