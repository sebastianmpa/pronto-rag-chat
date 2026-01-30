import DefaultLayout from '../../layout/DefaultLayout';
import { useTranslation } from 'react-i18next';
import LocatedTermTable from '../../components/features/terms/LocatedTermTable';

const LocatedTermsPage = () => {
  const { t } = useTranslation();

  return (
    <DefaultLayout>
      <LocatedTermTable />
    </DefaultLayout>
  );
};

export default LocatedTermsPage;
