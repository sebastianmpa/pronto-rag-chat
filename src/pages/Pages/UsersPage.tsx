import React from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import UserTable from '../../components/features/users/UserTable';

const UsersPage: React.FC = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Usuarios" />
      <div className="mt-6">
        <UserTable />
      </div>
    </DefaultLayout>
  );
};

export default UsersPage;
