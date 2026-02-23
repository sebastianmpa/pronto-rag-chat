import React from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import { ProductPartsTable } from '../components/features/product-parts';

const ProductParts: React.FC = () => {
  return (
    <>
      <Breadcrumb pageName="Product Parts" />
      
      <div className="flex flex-col gap-10">
        <ProductPartsTable />
      </div>
    </>
  );
};

export default ProductParts;