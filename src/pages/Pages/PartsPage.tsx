import DefaultLayout from '../../layout/DefaultLayout';
import PartsTable from '../../components/features/parts/PartsTable';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';

const PartsPage = () => {
  return (
    <DefaultLayout>
        <div className="mb-6"></div>
      <Breadcrumb pageName=" Related Parts Information" />
      <div className="flex flex-col gap-10">
        <PartsTable />
      </div>
    </DefaultLayout>
  );
};

export default PartsPage;
