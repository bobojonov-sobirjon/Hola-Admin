import ActiveTypesList from "./ActiveTypesList";

export default function RegistrationDriverIdentificationList() {
  return (
    <ActiveTypesList
      title="Registration — driver identification"
      breadcrumb="Registration — driver identification (terms)"
      listPath="admin-panel/registration-driver-identification/"
      detailsBasePath="/site-settings/registration-drivers"
      deleteEntityLabel="registration identification type"
    />
  );
}

