import RoleTable from '../../components/features/roles/RoleTable';
import DefaultLayout from '../../layout/DefaultLayout';

const Roles = () => {
  return (
    <DefaultLayout>
      <div className="flex flex-col gap-10">
        <RoleTable />
      </div>
    </DefaultLayout>
  );
};

export default Roles;