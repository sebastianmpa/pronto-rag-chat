import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import { useTranslation } from 'react-i18next';
import TermTable from '../../components/features/terms/TermTable';

const TermsPage = () => {
  const { t } = useTranslation();

  return (
    <DefaultLayout>
      <Breadcrumb pageName={t('sidebar.terms')} />
      <TermTable />
    </DefaultLayout>
  );
};

export default TermsPage;
