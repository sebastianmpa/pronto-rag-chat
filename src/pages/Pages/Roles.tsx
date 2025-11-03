import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import RoleTable from '../../components/features/roles/RoleTable';
import DefaultLayout from '../../layout/DefaultLayout';

const Roles = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Roles" />
      
      <div className="flex flex-col gap-10">
        <RoleTable />
      </div>
    </DefaultLayout>
  );
};

export default Roles;