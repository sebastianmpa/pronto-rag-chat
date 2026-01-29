import DefaultLayout from '../../layout/DefaultLayout';
import PermissionsTable from '../../components/features/permissions/PermissionsTable';

const Permissions = () => {
  return (
    <DefaultLayout>
      <div className="flex flex-col gap-10">
        <PermissionsTable />
      </div>
    </DefaultLayout>
  );
};

export default Permissions;
