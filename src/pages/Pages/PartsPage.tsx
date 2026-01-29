import DefaultLayout from '../../layout/DefaultLayout';
import PartsTable from '../../components/features/parts/PartsTable';

const PartsPage = () => {
  return (
    <DefaultLayout>
        <div className="mb-6"></div>
      <div className="flex flex-col gap-10">
        <PartsTable />
      </div>
    </DefaultLayout>
  );
};

export default PartsPage;
