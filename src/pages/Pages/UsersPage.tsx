import React from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import UserTable from '../../components/features/users/UserTable';

const UsersPage: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="mt-6">
        <UserTable />
      </div>
    </DefaultLayout>
  );
};

export default UsersPage;
