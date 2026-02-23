import DefaultLayout from '../../layout/DefaultLayout';
import ProductPartsTable from '../../components/features/product-parts/ProductPartsTable';

const ProductParts = () => {
  return (
    <DefaultLayout>
      <div className="flex flex-col gap-10">
        <ProductPartsTable />
      </div>
    </DefaultLayout>
  );
};

export default ProductParts;