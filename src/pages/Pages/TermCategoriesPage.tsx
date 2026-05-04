import DefaultLayout from '../../layout/DefaultLayout';
import { useTranslation } from 'react-i18next';
import TermCategoryTable from '../../components/features/term-categories/TermCategoryTable';

const TermCategoriesPage = () => {
  const { t } = useTranslation();

  return (
    <DefaultLayout>
      <TermCategoryTable />
    </DefaultLayout>
  );
};

export default TermCategoriesPage;
