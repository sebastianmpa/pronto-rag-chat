import DefaultLayout from '../../layout/DefaultLayout';
import { useTranslation } from 'react-i18next';
import TermTable from '../../components/features/terms/TermTable';

const TermsPage = () => {
  const { t } = useTranslation();

  return (
    <DefaultLayout>
      <TermTable />
    </DefaultLayout>
  );
};

export default TermsPage;
