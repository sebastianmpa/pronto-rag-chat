// Mock de datos para partes
import { useMemo, useState } from 'react';
import { useTable, Column } from 'react-table';
import { useManufacturers } from '../../../hooks/useManufacturers';
import { usePartInfo } from '../../../hooks/usePartInfo';
import { PartInfo } from '../../../types/partInfo';



const PartsTable = () => {
  // Filtros para la API: partNumber, mfrId, location
  const [partNumberFilter, setPartNumberFilter] = useState('');
  const [mfrIdFilter, setMfrIdFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showTable, setShowTable] = useState(false);

  // Obtener manufacturers desde el hook
  const { manufacturers, loading: loadingManufacturers } = useManufacturers();

  // Hook para obtener la info de la parte filtrada
  const { partInfo, loading: loadingPart, error, fetchPartInfo } = usePartInfo(
    partNumberFilter,
    mfrIdFilter,
    locationFilter as '1' | '4'
  );


  // Columnas de la tabla
  const columns: Column<PartInfo>[] = useMemo(
    () => [
      { Header: 'Part Number', accessor: 'partNumber' },
      { Header: 'Manufacturer', accessor: 'mfrId' },
      { Header: 'Location', accessor: 'location' },
      { Header: 'Description', accessor: (row) => row.generalInfo.DESCRIPTION, id: 'description' },
      { Header: 'Qty Loc', accessor: 'qty_loc' },
      { Header: 'Related Count', accessor: 'related_count' },
    ],
    []
  );

  return (
    <section className="data-table-common rounded-sm border border-stroke bg-white py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Filtros como formulario */}
      <form
        className="w-full px-8 pt-4 pb-2 bg-white border-x border-b border-stroke rounded-b-lg shadow-sm flex flex-col gap-4"
        onSubmit={async e => {
          e.preventDefault();
          setShowTable(true);
          await fetchPartInfo();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="partNumberFilter" className="block text-sm font-medium text-gray-700 mb-2">Part Number</label>
            <input
              id="partNumberFilter"
              type="text"
              value={partNumberFilter}
              onChange={e => setPartNumberFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-primary"
              placeholder="Enter part number"
            />
          </div>
          <div>
            <label htmlFor="mfrIdFilter" className="block text-sm font-medium text-gray-700 mb-2">MFR ID</label>
            <select
              id="mfrIdFilter"
              value={mfrIdFilter}
              onChange={e => setMfrIdFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-primary"
              disabled={loadingManufacturers}
            >
              {loadingManufacturers ? (
                <option disabled>Loading...</option>
              ) : (
                manufacturers
                  .filter(mfr => mfr.MFRID && mfr.MFRID.trim() !== '')
                  .sort((a, b) => {
                    const aStr = (a.MFRID + ' ' + (a.NAME || '')).toLowerCase();
                    const bStr = (b.MFRID + ' ' + (b.NAME || '')).toLowerCase();
                    return aStr.localeCompare(bStr);
                  })
                  .map(mfr => (
                    <option key={mfr.MFRID} value={mfr.MFRID}>{mfr.MFRID} - {mfr.NAME}</option>
                  ))
              )}
            </select>
          </div>
          <div>
            <label htmlFor="locationFilter" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select
              id="locationFilter"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-primary"
            >
              <option value="1">1</option>
              <option value="4">4</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            className="rounded-md border border-primary bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark transition"
            disabled={loadingPart}
          >
            {loadingPart ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      {/* Tabla solo si se ha hecho query y hay resultado */}
      {showTable && partInfo && (
        <div className="relative mt-6">
          <table className="datatable-table w-full table-auto border-collapse overflow-hidden break-words px-4 md:table-fixed md:overflow-auto md:px-8">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="text-left px-2 py-2 font-semibold">{col.Header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-2">{partInfo.partNumber}</td>
                <td className="px-2 py-2">{partInfo.mfrId}</td>
                <td className="px-2 py-2">{partInfo.location}</td>
                <td className="px-2 py-2">{partInfo.generalInfo.DESCRIPTION}</td>
                <td className="px-2 py-2">{partInfo.qty_loc}</td>
                <td className="px-2 py-2">{partInfo.related_count}</td>
              </tr>
              {Array.isArray(partInfo.relatedParts) && partInfo.relatedParts.length > 0 && (
                <tr>
                  <td colSpan={columns.length} className="bg-gray-50 px-6 py-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr>
                            <th className="px-2 py-1 text-left font-semibold">MFR ID</th>
                            <th className="px-2 py-1 text-left font-semibold">Part Number</th>
                            <th className="px-2 py-1 text-left font-semibold">Description</th>
                            <th className="px-2 py-1 text-left font-semibold">Qty Loc</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partInfo.relatedParts.map((rel, relIdx) => (
                            <tr key={relIdx}>
                              <td className="px-2 py-1">{rel.MFRID}</td>
                              <td className="px-2 py-1">{rel.PARTNUMBER}</td>
                              <td className="px-2 py-1">{rel.DESCRIPTION}</td>
                              <td className="px-2 py-1">{rel.QUANTITYLOC}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {showTable && !loadingPart && !partInfo && (
        <div className="text-center text-gray-500 py-8">No parts found for the given filters.</div>
      )}
      {/* Only show error if it's not a 400 (bad request, which means no parts found) */}
      {error && !/400/.test(error) && (
        <div className="text-center text-red-500 py-2">{error}</div>
      )}
    </section>
  );
};

export default PartsTable;
