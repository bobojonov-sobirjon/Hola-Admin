import ActiveTypeDetails from "./ActiveTypeDetails";

export default function RegistrationDriverIdentificationDetails() {
  return (
    <ActiveTypeDetails
      title="Registration — driver identification"
      breadcrumb="Registration — driver identification (terms)"
      listRoute="/accounts/registration-drivers"
      apiBasePath="admin-panel/registration-driver-identification"
    />
  );
}

