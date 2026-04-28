import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";

export default function OrdersPlaceholder({ title }: { title: string }) {
  return (
    <>
      <PageMeta title={title} description={title} />
      <PageBreadcrumb pageTitle={title} />
      <ComponentCard title={title} desc="Coming soon">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          This page will be connected to API later.
        </div>
      </ComponentCard>
    </>
  );
}

