// Mock de datos para partes
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable, Column } from 'react-table';
import { useManufacturers } from '../../../hooks/useManufacturers';
import { usePartInfo } from '../../../hooks/usePartInfo';
import { PartInfo } from '../../../types/partInfo';



const PartsTable = () => {
  const { t } = useTranslation();
  // Filtros para la API: partNumber, mfrId, location
  const [partNumberFilter, setPartNumberFilter] = useState('');
  const [mfrIdFilter, setMfrIdFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showTable, setShowTable] = useState(false);

  // Obtener manufacturers desde el hook
  const { manufacturers, loading: loadingManufacturers } = useManufacturers();
  // State for filtering manufacturer options in the select (does not affect fetched data)
  const [mfrSelectFilter, setMfrSelectFilter] = useState('');

  // Hook para obtener la info de la parte filtrada
  const { partInfo, loading: loadingPart, error, fetchPartInfo } = usePartInfo(
    partNumberFilter,
    mfrIdFilter,
    locationFilter as '1' | '4'
  );


  // Columnas de la tabla
  const columns: Column<PartInfo>[] = useMemo(
    () => [
      { Header: t('parts_table.part_number'), accessor: 'partNumber' },
      { Header: t('parts_table.mfr_id'), accessor: 'mfrId' },
      { Header: t('parts_table.location'), accessor: 'location' },
      { Header: t('parts_table.description'), accessor: (row) => row.generalInfo.DESCRIPTION, id: 'description' },
      { Header: t('parts_table.qty_loc'), accessor: 'qty_loc' },
      { Header: t('parts_table.related_count'), accessor: 'related_count' },
    ],
    [t]
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
            <label htmlFor="locationFilter" className="block text-sm font-medium text-gray-700 mb-2">{t('parts_table.location')}</label>
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
          <div>
            <label htmlFor="mfrIdFilter" className="block text-sm font-medium text-gray-700 mb-2">{t('parts_table.mfr_id')}</label>
            {/* Hidden input for filtering, not visible to user */}
            <input
              type="text"
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
              tabIndex={-1}
              aria-hidden="true"
              value={mfrSelectFilter}
              onChange={() => {}}
              autoComplete="off"
            />
            <select
              id="mfrIdFilter"
              value={mfrIdFilter}
              onChange={e => setMfrIdFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-primary"
              disabled={loadingManufacturers}
              onKeyDown={e => {
                // Only filter for letters, numbers, backspace
                if (e.key.length === 1 && /[\w\s]/.test(e.key)) {
                  setMfrSelectFilter(prev => {
                    const next = (prev + e.key).slice(0, 3); // Only keep up to 3 chars
                    return next;
                  });
                } else if (e.key === 'Backspace') {
                  setMfrSelectFilter(prev => prev.slice(0, -1));
                } else if (e.key === 'Escape') {
                  setMfrSelectFilter('');
                }
              }}
              onBlur={() => setTimeout(() => setMfrSelectFilter(''), 200)}
            >
              {loadingManufacturers ? (
                <option disabled>{t('parts_table.loading')}</option>
              ) : (
                manufacturers
                  .filter(mfr => {
                    if (!mfr.MFRID || mfr.MFRID.trim() === '') return false;
                    if (!mfrSelectFilter) return true;
                    const filter = mfrSelectFilter.toLowerCase();
                    // Filter by prefix (startsWith) on MFRID or NAME, using first 2-3 chars
                    return (
                      mfr.MFRID.toLowerCase().startsWith(filter) ||
                      (mfr.NAME && mfr.NAME.toLowerCase().startsWith(filter))
                    );
                  })
                  .map(mfr => (
                    <option key={mfr.MFRID} value={mfr.MFRID}>{mfr.MFRID} - {mfr.NAME}</option>
                  ))
              )}
            </select>
          </div>
          <div>
            <label htmlFor="partNumberFilter" className="block text-sm font-medium text-gray-700 mb-2">{t('parts_table.part_number')}</label>
            <input
              id="partNumberFilter"
              type="text"
              value={partNumberFilter}
              onChange={e => setPartNumberFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-primary"
              placeholder={t('parts_table.enter_part_number')}
            />
          </div>
          
          
        </div>
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            className="rounded-md border border-primary bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark transition"
            disabled={loadingPart}
          >
            {loadingPart ? t('parts_table.searching') : t('parts_table.search')}
          </button>
        </div>
      </form>
      {/* Tabla solo si se ha hecho query y hay resultado */}
      {showTable && !loadingPart && (
        partInfo && partInfo.partNumber ? (
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
                  <td className="px-2 py-2">{partInfo.generalInfo && partInfo.generalInfo.DESCRIPTION ? partInfo.generalInfo.DESCRIPTION : '-'}</td>
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
                              <th className="px-2 py-1 text-left font-semibold">{t('parts_table.mfr_id')}</th>
                              <th className="px-2 py-1 text-left font-semibold">{t('parts_table.part_number')}</th>
                              <th className="px-2 py-1 text-left font-semibold">{t('parts_table.description')}</th>
                              <th className="px-2 py-1 text-left font-semibold">{t('parts_table.qty_loc')}</th>
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
        ) : null
      )}
      {showTable && !loadingPart && (!partInfo || !partInfo.partNumber) && (
  <div className="text-center text-gray-500 py-8">{t('parts_table.no_parts_found')}</div>
      )}
      {error && (
  <div className="text-center text-red-500 py-2">{typeof error === 'string' ? error : t('parts_table.error_occurred')}</div>
      )}
    </section>
  );
};

export default PartsTable;
