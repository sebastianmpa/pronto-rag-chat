import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DropdownDefault from '../components/Dropdowns/DropdownDefault';
import DefaultLayout from '../layout/DefaultLayout';
import {
  useConversationsPaginated,
  useConversationById,
} from '../hooks/useConversation';
import { getConversationsPaginated } from '../libs/ConversationService';
import { useCustomerById } from '../hooks/useCustomer';
import { format } from 'date-fns';
import QuestionsAnswersModal from '../components/features/questions-answers/QuestionsAnswersModal';

// Helper para extraer texto y tabla del content
const parseMessageContent = (
  content: string,
  _hasTable?: boolean,
  tableData?: { partInfo?: any[] }
): { text: string; tableData: any[] | null } => {
  // Si tenemos tableData estructurado del nuevo formato de respuesta, priorizarlo
  if (tableData?.partInfo && Array.isArray(tableData.partInfo)) {
    console.log(
      '[parseMessageContent] ✅ Using structured tableData with',
      tableData.partInfo.length,
      'items'
    );
    return { text: content, tableData: tableData.partInfo };
  }

  // Si no hay tableData estructurado, no hay tabla
  return { text: content, tableData: null };
};

// PartsAccordion component - nuevo formato de visualización de partes
const PartsAccordion: React.FC<{ data: any[]; messageId: string }> = ({
  data,
}) => {
  const { t } = useTranslation();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | string | null>(null);
  const [copiedRelatedIdx, setCopiedRelatedIdx] = useState<{
    itemIdx: number;
    partIdx: number;
  } | null>(null);
  const [viewingLocation, setViewingLocation] = useState<{
    [key: string]: 1 | 4;
  }>({});

  if (!Array.isArray(data)) return null;

  // Helper: Agrupar partes por mfrId + partNumber y luego por ubicación
  const groupedData = useMemo(() => {
    const grouped = new Map<string, { loc1?: any; loc4?: any }>();

    data.forEach((item, idx) => {
      const mfrId = item.mfrId || item.MFRID || 'UNKNOWN';
      const partNumber = item.partNumber || item.PARTNUMBER || 'UNKNOWN';
      const key = `${mfrId}|${partNumber}`;

      if (!grouped.has(key)) {
        grouped.set(key, {});
      }
      const group = grouped.get(key)!;

      // Si no tiene location definido, asumir que es location 1
      // Convertir a número si es string
      const location = parseInt(String(item.location)) || 1;

      if (location === 1) {
        group.loc1 = item;
      } else if (location === 4) {
        group.loc4 = item;
      }

      console.log(
        `[PartsAccordion] Item ${idx}: mfrId=${mfrId}, partNumber=${partNumber}, location=${location}`
      );
    });

    const result = Array.from(grouped.values());
    console.log('[PartsAccordion] Grouped data:', result.length, 'groups');
    return result;
  }, [data]);

  // Helper to copy part number
  const handleCopy = (partNumber: string, idx: number | string) => {
    if (!partNumber) return;
    navigator.clipboard.writeText(partNumber);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };

  // Helper to copy related part number
  const handleCopyRelated = (
    partNumber: string,
    itemIdx: number,
    partIdx: number
  ) => {
    if (!partNumber) return;
    navigator.clipboard.writeText(partNumber);
    setCopiedRelatedIdx({ itemIdx, partIdx });
    setTimeout(() => setCopiedRelatedIdx(null), 1200);
  };

  return (
    <div className="mx-auto mt-3 max-w-4xl">
      {groupedData.map((group, idx) => {
        console.log(`[PartsAccordion Render] Group ${idx}:`, group);

        // Determinar qué ubicación mostrar por defecto (preferir 1, luego 4)
        const defaultLocation = (group.loc1 ? 1 : group.loc4 ? 4 : 1) as 1 | 4;
        const currentLocation = viewingLocation[idx] || defaultLocation;
        let item = currentLocation === 1 ? group.loc1 : group.loc4;

        // Si la ubicación actual no existe, intentar usar la otra
        if (!item) {
          item = currentLocation === 1 ? group.loc4 : group.loc1;
        }

        // Si aún no hay item, no mostrar nada
        if (!item) {
          console.log(
            `[PartsAccordion Render] Group ${idx} has no item, skipping`
          );
          return null;
        }

        console.log(
          `[PartsAccordion Render] Group ${idx} rendering with item:`,
          item
        );

        const general = item.general_info || {};
        const relatedParts = item.related_parts || [];
        const mfrId = general.MFRID || item.mfrId || '-';
        const partNumber = general.PARTNUMBER || item.partNumber || '-';
        const description = general.DESCRIPTION || '-';
        const ubicacion = item.location || '-';
        const superseded = item.superseded || general.SUPERCEDETO || '-';
        const cantidad = item.qty_loc ?? general.QTY_LOC ?? '-';
        const hasAlternateLocation =
          currentLocation === 1 ? !!group.loc4 : !!group.loc1;

        return (
          <div
            key={idx}
            className="mx-auto mb-4 max-w-4xl overflow-hidden rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark"
          >
            {/* Header del acordeón */}
            <div className="bg-gray-50 hover:bg-gray-100 flex w-full items-center justify-between border-b border-stroke px-3 py-2 transition-colors dark:border-strokedark dark:bg-boxdark-2 dark:hover:bg-meta-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {item.productThumbnailImage &&
                  item.productThumbnailImage.startsWith('http') && (
                    <img
                      src={item.productThumbnailImage}
                      alt="thumb"
                      className="h-10 w-10 rounded border object-contain"
                    />
                  )}
                <div className="flex min-w-0 flex-1 flex-col">
                  {/* Primera línea: MFRID PARTNUMBER DESCRIPTION (sin separador) */}
                  <div className="text-gray-700 dark:text-gray-300 flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="truncate">{mfrId}</span>
                    <span className="truncate">{partNumber}</span>
                    <span className="flex-1 truncate">{description}</span>
                  </div>
                  {/* Segunda línea: Location y Superseded a la izquierda */}
                  <div className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3 text-xs">
                    <span className="truncate">
                      {t('parts_accordion.location')}: {ubicacion ?? '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="truncate">
                        {t('parts_accordion.superseded')}:{' '}
                        {superseded && superseded !== '' && superseded !== '-'
                          ? superseded
                          : '-'}
                      </span>
                      {superseded &&
                        superseded !== '' &&
                        superseded !== '-' && (
                          <button
                            type="button"
                            className="flex-shrink-0 rounded border border-transparent p-0.5 hover:bg-blue-100 focus:outline-none dark:hover:bg-blue-900"
                            title={t('parts_accordion.copy_part_number')}
                            onClick={() =>
                              handleCopy(superseded, `superseded-${idx}`)
                            }
                          >
                            <svg
                              className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                strokeWidth="2"
                                stroke="currentColor"
                                fill="none"
                              />
                              <rect
                                x="3"
                                y="3"
                                width="13"
                                height="13"
                                rx="2"
                                strokeWidth="2"
                                stroke="currentColor"
                                fill="none"
                              />
                            </svg>
                          </button>
                        )}
                    </span>
                  </div>
                </div>
              </div>
              {/* Quantity alineado a la derecha en su propia columna */}
              <div className="ml-3 mr-2 flex flex-col items-end justify-center">
                <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap text-xs font-semibold">
                  {t('parts_accordion.quantity')}: {cantidad ?? '-'}
                </span>
              </div>
              <div className="ml-2 flex items-center gap-2">
                {/* View location switch - mostrar si hay ubicación alternativa */}
                {hasAlternateLocation && (
                  <div
                    className="bg-gray-100 inline-flex items-center gap-1 rounded-full border-2 border-stroke p-1 dark:border-strokedark dark:bg-boxdark-2"
                    role="tablist"
                    aria-label="Locations switch"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setViewingLocation((prev) => ({ ...prev, [idx]: 1 }))
                      }
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        currentLocation === 1
                          ? 'bg-primary text-white shadow'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                      title={`${t('parts_accordion.view_location')} 1`}
                      aria-pressed={currentLocation === 1}
                    >
                      1
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setViewingLocation((prev) => ({ ...prev, [idx]: 4 }))
                      }
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        currentLocation === 4
                          ? 'bg-primary text-white shadow'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                      title={`${t('parts_accordion.view_location')} 4`}
                      aria-pressed={currentLocation === 4}
                    >
                      4
                    </button>
                  </div>
                )}
                {/* Copy button */}
                <button
                  type="button"
                  className="rounded border border-transparent p-1 hover:bg-blue-100 focus:outline-none dark:hover:bg-blue-900"
                  title={t('parts_accordion.copy_part_number')}
                  onClick={() => handleCopy(partNumber, idx)}
                >
                  <svg
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="none"
                    />
                    <rect
                      x="3"
                      y="3"
                      width="13"
                      height="13"
                      rx="2"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="none"
                    />
                  </svg>
                </button>
                {copiedIdx === idx && (
                  <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                    {t('parts_accordion.copied')}
                  </span>
                )}
                {/* Expand/collapse button */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedIdx(expandedIdx === idx ? null : idx)
                  }
                  className="hover:bg-gray-200 rounded border border-transparent p-1 focus:outline-none dark:hover:bg-meta-4"
                  title={expandedIdx === idx ? 'Close' : 'Open'}
                >
                  <svg
                    className={`text-gray-600 dark:text-gray-400 h-5 w-5 transition-transform ${
                      expandedIdx === idx ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {/* Contenido expandido */}
            {expandedIdx === idx && (
              <div className="p-4">
                {item.productStandarImage &&
                  item.productStandarImage.startsWith('http') && (
                    <div className="mb-3 flex justify-center">
                      <img
                        src={item.productStandarImage}
                        alt="main"
                        className="max-h-40 rounded border object-contain"
                      />
                    </div>
                  )}
                {/* Mostrar superseded_list alineado a la izquierda, con título, si tiene valores válidos */}
                {Array.isArray(item.superseded_list) &&
                  item.superseded_list.filter(
                    (x) => x && x !== 'null' && x !== null
                  ).length > 0 && (
                    <div className="text-gray-700 dark:text-gray-300 mb-3 text-left text-xs">
                      <span className="font-semibold">
                        {t('parts_accordion.superseded_list')}:
                      </span>{' '}
                      {item.superseded_list
                        .filter((x) => x && x !== 'null' && x !== null)
                        .join('  >>  ')}
                    </div>
                  )}
                {/* Título de la tabla */}
                {relatedParts && relatedParts.length > 0 && (
                  <div className="text-gray-800 dark:text-gray-100 mb-2 text-sm font-semibold">
                    {t('parts_accordion.related_products')}
                  </div>
                )}
                {/* Tabla de partes relacionadas */}
                {relatedParts && relatedParts.length > 0 && (
                  <div className="min-w-[600px] overflow-x-auto">
                    <table className="w-full border border-stroke text-xs dark:border-strokedark">
                      <thead className="bg-white dark:bg-boxdark">
                        <tr>
                          <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-left font-medium dark:border-strokedark">
                            {t('parts_accordion.mfr_id')}
                          </th>
                          <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-left font-medium dark:border-strokedark">
                            {t('parts_accordion.part_number')}
                          </th>
                          <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-left font-medium dark:border-strokedark">
                            {t('parts_accordion.description')}
                          </th>
                          <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-right font-medium dark:border-strokedark">
                            {t('parts_accordion.qty')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-boxdark">
                        {relatedParts.map((part: any, pidx: number) => (
                          <tr
                            key={pidx}
                            className="hover:bg-gray-50 border-b border-stroke dark:border-strokedark dark:hover:bg-boxdark-2"
                          >
                            <td className="text-gray-900 px-2 py-1 dark:text-white">
                              {part.MFRID || '-'}
                            </td>
                            <td className="text-gray-900 px-2 py-1 dark:text-white">
                              <div className="flex items-center gap-1">
                                <span>{part.PARTNUMBER || '-'}</span>
                                {part.PARTNUMBER && (
                                  <button
                                    type="button"
                                    className="flex-shrink-0 rounded border border-transparent p-0.5 hover:bg-blue-100 focus:outline-none dark:hover:bg-blue-900"
                                    title={t(
                                      'parts_accordion.copy_part_number'
                                    )}
                                    onClick={() =>
                                      handleCopyRelated(
                                        part.PARTNUMBER,
                                        idx,
                                        pidx
                                      )
                                    }
                                  >
                                    <svg
                                      className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <rect
                                        x="9"
                                        y="9"
                                        width="13"
                                        height="13"
                                        rx="2"
                                        strokeWidth="2"
                                        stroke="currentColor"
                                        fill="none"
                                      />
                                      <rect
                                        x="3"
                                        y="3"
                                        width="13"
                                        height="13"
                                        rx="2"
                                        strokeWidth="2"
                                        stroke="currentColor"
                                        fill="none"
                                      />
                                    </svg>
                                  </button>
                                )}
                                {copiedRelatedIdx?.itemIdx === idx &&
                                  copiedRelatedIdx?.partIdx === pidx && (
                                    <span className="text-xs text-green-600 dark:text-green-400">
                                      {t('parts_accordion.copied')}
                                    </span>
                                  )}
                              </div>
                            </td>
                            <td className="text-gray-900 px-2 py-1 dark:text-white">
                              {part.DESCRIPTION || '-'}
                            </td>
                            <td className="text-gray-900 min-w-[60px] px-2 py-1 text-right dark:text-white">
                              {part.QUANTITYLOC ?? '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Si no hay partes relacionadas */}
                {(!relatedParts || relatedParts.length === 0) && (
                  <div className="text-gray-500 mt-2 text-xs">
                    {t('parts_accordion.no_related_parts')}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// TableCollapsible - formato antiguo para datos de objeto
const TableCollapsible: React.FC<{
  tableData: any;
  messageId: string;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ tableData, isExpanded, onToggle }) => {
  const { t } = useTranslation();
  // Si table es false o "error", no mostrar nada
  if (tableData === false || tableData === 'error' || !tableData) return null;

  const { generalInfo, relatedParts } = tableData;

  return (
    <div className="mx-auto mt-3 max-w-3xl overflow-hidden rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark">
      {/* Header clickeable */}
      <button
        onClick={onToggle}
        className="bg-gray-50 hover:bg-gray-100 flex w-full items-center justify-between border-b border-stroke px-3 py-2 transition-colors dark:border-strokedark dark:bg-boxdark-2 dark:hover:bg-meta-4"
      >
        <span className="text-gray-700 dark:text-gray-300 text-xs font-semibold">
          📊 {t('parts_accordion.parts_information')}
        </span>
        <svg
          className={`text-gray-600 dark:text-gray-400 h-4 w-4 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Tabla desplegable */}
      {isExpanded && (
        <div className="max-h-[500px] overflow-auto">
          {/* General Info como tabla principal */}
          {generalInfo && (
            <div className="min-w-[600px] overflow-x-auto">
              <table className="w-full table-auto border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-stroke dark:border-strokedark dark:bg-boxdark-2">
                    <th className="text-gray-700 dark:text-gray-300 px-2 py-2 text-left font-semibold">
                      {t('parts_accordion.mfr_id')}
                    </th>
                    <th className="text-gray-700 dark:text-gray-300 px-2 py-2 text-left font-semibold">
                      {t('parts_accordion.part_number')}
                    </th>
                    <th className="text-gray-700 dark:text-gray-300 px-2 py-2 text-left font-semibold">
                      {t('parts_accordion.description')}
                    </th>
                    {generalInfo.SUPERCEDETO && (
                      <th className="text-gray-700 dark:text-gray-300 px-2 py-2 text-left font-semibold">
                        {t('parts_accordion.superseded')}
                      </th>
                    )}
                    <th className="text-gray-700 dark:text-gray-300 px-2 py-2 text-right font-semibold">
                      {t('parts_accordion.qty')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50 border-b border-stroke dark:border-strokedark dark:hover:bg-boxdark-2">
                    <td className="text-gray-900 px-2 py-2 dark:text-white">
                      {generalInfo.MFRID || '-'}
                    </td>
                    <td className="text-gray-900 px-2 py-2 dark:text-white">
                      {generalInfo.PARTNUMBER || '-'}
                    </td>
                    <td className="text-gray-900 px-2 py-2 dark:text-white">
                      {generalInfo.DESCRIPTION || '-'}
                    </td>
                    {generalInfo.SUPERCEDETO && (
                      <td className="text-gray-900 px-2 py-2 font-medium text-blue-600 dark:text-blue-400 dark:text-white">
                        {generalInfo.SUPERCEDETO}
                      </td>
                    )}
                    <td className="text-gray-900 px-2 py-2 text-right dark:text-white">
                      {generalInfo.QTY_LOC ?? '-'}
                    </td>
                  </tr>
                  {/* Related Parts como filas expandidas */}
                  {relatedParts && relatedParts.length > 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="bg-gray-50 px-3 py-3 dark:bg-boxdark-2"
                      >
                        <div className="mb-2">
                          <span className="text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase">
                            {t('parts_accordion.related_products')} (
                            {relatedParts.length})
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border border-stroke text-xs dark:border-strokedark">
                            <thead className="bg-white dark:bg-boxdark">
                              <tr>
                                <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-left font-medium dark:border-strokedark">
                                  {t('parts_accordion.mfr_id')}
                                </th>
                                <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-left font-medium dark:border-strokedark">
                                  {t('parts_accordion.part_number')}
                                </th>
                                <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-left font-medium dark:border-strokedark">
                                  {t('parts_accordion.description')}
                                </th>
                                <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-right font-medium dark:border-strokedark">
                                  {t('parts_accordion.qty')}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-boxdark">
                              {relatedParts.map((part: any, idx: number) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-gray-50 border-b border-stroke dark:border-strokedark dark:hover:bg-boxdark-2"
                                >
                                  <td className="text-gray-900 px-2 py-1 dark:text-white">
                                    {part.MFRID || '-'}
                                  </td>
                                  <td className="text-gray-900 px-2 py-1 dark:text-white">
                                    {part.PARTNUMBER || '-'}
                                  </td>
                                  <td className="text-gray-900 px-2 py-1 dark:text-white">
                                    {part.DESCRIPTION || '-'}
                                  </td>
                                  <td className="text-gray-900 px-2 py-1 text-right dark:text-white">
                                    {part.QUANTITYLOC ?? '-'}
                                  </td>
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
        </div>
      )}
    </div>
  );
};

const Messages: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const { t } = useTranslation();
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [qaInitialQuestion, setQaInitialQuestion] = useState('');
  const [qaInitialAnswer, setQaInitialAnswer] = useState('');
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  // Dynamic page offset to compute available viewport height for the chat panel
  const [pageOffset, setPageOffset] = useState<number>(186);
  // Estado para controlar qué tabla está abierta (por message id)
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);

  // Hooks para todas las conversaciones
  const { data: chats, loading: loadingChats } = useConversationsPaginated({
    page,
    limit,
  });
  const [pollChats, setPollChats] = useState<any>(null);

  // Polling: refresh chats every 5 seconds
  useEffect(() => {
    let ignore = false;
    const poll = async () => {
      try {
        const result = await getConversationsPaginated(page, limit);
        if (!ignore) setPollChats(result);
      } catch (e) {
        // ignore polling errors
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [page, limit]);

  const conversationId = selectedChat?.id ?? '';
  const { data: chatDetail, loading: loadingDetail } =
    useConversationById(conversationId);

  // Customer del chat seleccionado
  const { data: customerData } = useCustomerById(chatDetail?.customer_id ?? '');

  // Ref para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [chatDetail?.conversation_message]);

  // Measure header + layout paddings to compute the available height for the chat panel
  useEffect(() => {
    const measure = () => {
      try {
        const header = document.querySelector('header') as HTMLElement | null;
        const headerHeight = header
          ? Math.ceil(header.getBoundingClientRect().height)
          : 86;

        // Try to find the main layout wrapper to include its vertical paddings if present
        const mainWrapper =
          (document.querySelector('#root') as HTMLElement | null) ||
          (document.querySelector('main') as HTMLElement | null);
        let paddingTop = 0;
        let paddingBottom = 0;
        if (mainWrapper) {
          const cs = getComputedStyle(mainWrapper);
          paddingTop = parseFloat(cs.paddingTop || '0') || 0;
          paddingBottom = parseFloat(cs.paddingBottom || '0') || 0;
        }

        // Small extra offset to avoid clipping sticky elements
        const extra = 0;
        setPageOffset(
          headerHeight + Math.round(paddingTop + paddingBottom) + extra
        );
      } catch (e) {
        // noop
      }
    };

    measure();
    window.addEventListener('resize', measure);
    // Observe header size changes if ResizeObserver is available
    let ro: ResizeObserver | null = null;
    const headerEl = document.querySelector('header');
    if ((window as any).ResizeObserver && headerEl) {
      ro = new (window as any).ResizeObserver(() => measure());
      ro.observe(headerEl);
    }
    return () => {
      window.removeEventListener('resize', measure);
      if (ro) ro.disconnect();
    };
  }, []);

  // Helper function to format dates
  const formatDate = (date: string) => {
    return format(new Date(date), 'MMMM d, yyyy');
  };

  // Formatea los mensajes del assistant para saltos de línea y URLs
  const renderMessageContent = (content: string, role?: string) => {
    // Try to parse as JSON if it looks like JSON
    let displayContent = content;
    let isJsonError = false;

    // Primero, intenta parsear la primera capa de JSON (string que contiene JSON)
    if (content.trim().startsWith('"') && content.trim().endsWith('"')) {
      try {
        displayContent = JSON.parse(content);
      } catch (e) {
        // Si falla, mantener el contenido original
      }
    }

    // Ahora intenta parsear como JSON (segunda capa o JSON directo)
    if (
      displayContent.trim().startsWith('{') &&
      displayContent.trim().endsWith('}')
    ) {
      try {
        let parsed = JSON.parse(displayContent);

        // Si tiene un campo error, extraer ese
        if (parsed.error) {
          displayContent = parsed.error;
          isJsonError = true;
        }
      } catch (e) {
        // Si falla el parseo, intentar con estrategias alternativas
        try {
          // Estrategia 1: Reemplazar valores de Python con null/true/false
          let normalized = displayContent
            .replace(/:\s*None\b/g, ': null')
            .replace(/:\s*True\b/g, ': true')
            .replace(/:\s*False\b/g, ': false');

          let parsed = JSON.parse(normalized);
          if (parsed.error) {
            displayContent = parsed.error;
            isJsonError = true;
          }
        } catch (e2) {
          // Si sigue fallando, usar el contenido original
          displayContent = content;
        }
      }
    }

    if (role === 'assistant') {
      // Regex for Markdown links: [text](url)
      const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+[\w/])\)/g;
      // Regex for plain URLs
      const urlRegex = /(https?:\/\/[^\s)]+[\w/])/g;
      // Regex for HTML tags: <b class='pronto-sku'>text</b>
      const htmlTagRegex = /<b\s+class=['"]pronto-sku['"]\s*>([^<]+)<\/b>/g;

      // Split by line breaks first
      return displayContent.split(/\n|\r\n/).map((line, idx) => {
        let parts: (string | JSX.Element)[] = [];
        let lastIdx = 0;
        let match;

        // First, process HTML tags <b class='pronto-sku'>...</b>
        while ((match = htmlTagRegex.exec(line)) !== null) {
          if (match.index > lastIdx) {
            parts.push(line.slice(lastIdx, match.index));
          }
          parts.push(
            <span
              key={`pronto-sku-${idx}-${match.index}`}
              className="font-bold text-blue-600 dark:text-blue-400"
            >
              {match[1]}
            </span>
          );
          lastIdx = match.index + match[0].length;
        }
        if (lastIdx < line.length) {
          parts.push(line.slice(lastIdx));
        }

        // Then, replace Markdown links with anchor tags
        parts = parts.flatMap((part, i) => {
          if (typeof part !== 'string') return [part];

          let subParts: (string | JSX.Element)[] = [];
          let subLastIdx = 0;
          let mdMatch;

          while ((mdMatch = mdLinkRegex.exec(part)) !== null) {
            if (mdMatch.index > subLastIdx) {
              subParts.push(part.slice(subLastIdx, mdMatch.index));
            }
            subParts.push(
              <a
                key={mdMatch[2] + i}
                href={mdMatch[2]}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all underline"
              >
                {mdMatch[1]}
              </a>
            );
            subLastIdx = mdMatch.index + mdMatch[0].length;
          }
          if (subLastIdx < part.length) {
            subParts.push(part.slice(subLastIdx));
          }

          return subParts;
        });

        // Finally, process plain URLs
        parts = parts.flatMap((part, i) => {
          if (typeof part !== 'string') return [part];
          return part.split(urlRegex).map((sub, j) => {
            let url = sub;
            let isUrl = false;
            if (/^https?:\/\//.test(sub)) {
              isUrl = true;
              if (url.endsWith(')')) {
                const open = url.slice(0, -1).split('(').length - 1;
                const close = url.slice(0, -1).split(')').length - 1;
                if (open > close) {
                  url = url.slice(0, -1);
                }
              }
            }
            if (isUrl) {
              const isPdf = url.trim().toLowerCase().endsWith('.pdf');
              return (
                <a
                  key={url + '-' + i + '-' + j}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all underline"
                >
                  {isPdf ? 'Download file' : 'Open link'}
                </a>
              );
            }
            return sub;
          });
        });

        // If it was a JSON error, show it in a styled container
        if (isJsonError && idx === 0) {
          return (
            <div
              key={idx}
              className="rounded-sm border border-yellow-500 bg-yellow-50 p-3 text-yellow-700 dark:border-yellow-600 dark:bg-yellow-900 dark:text-yellow-200"
            >
              {parts}
            </div>
          );
        }

        return (
          <React.Fragment key={idx}>
            {parts}
            <br />
          </React.Fragment>
        );
      });
    }
    // Usuario: solo texto plano
    return displayContent;
  };

  return (
    <DefaultLayout noPadding>
      <div
        className="min-h-0 overflow-hidden"
        style={{ height: `calc(100vh - ${pageOffset}px)` }}
      >
        <div className="h-full min-h-0 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark xl:flex">
          {/* Chat List */}
          <div className="hidden h-full min-h-0 flex-col border-r-2 border-blue-300 bg-white dark:bg-boxdark xl:flex xl:w-72">
            {/* Header */}
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
              <div className="flex items-center justify-between gap-2">
                <h4 className="whitespace-nowrap text-sm font-medium text-black dark:text-white">
                  {t('all_messages')}{' '}
                  <span className="ml-1 text-xs">{chats?.totalItems ?? 0}</span>
                </h4>
                {/* You can add a new chat button here if you want */}
              </div>
            </div>

            {/* Chats per page selector */}
            <div className="flex items-center justify-between border-b border-stroke px-6 py-3 dark:border-strokedark">
              <label
                htmlFor="limit"
                className="text-sm font-medium text-black dark:text-white"
              >
                {t('show_last')}
              </label>
              <select
                id="limit"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="ml-2 rounded border border-stroke bg-white px-2 py-1 text-sm dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="border-b border-stroke px-6 py-3 dark:border-strokedark">
              <form className="relative">
                <input
                  type="text"
                  className="w-full rounded border border-stroke bg-gray-2 py-2.5 pl-5 pr-10 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
                  placeholder={t('search')}
                  disabled={loadingChats}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8.25 3C5.3505 3 3 5.3505 3 8.25C3 11.1495 5.3505 13.5 8.25 13.5C11.1495 13.5 13.5 11.1495 13.5 8.25C13.5 5.3505 11.1495 3 8.25 3ZM1.5 8.25C1.5 4.52208 4.52208 1.5 8.25 1.5C11.9779 1.5 15 4.52208 15 8.25C15 11.9779 11.9779 15 8.25 15C4.52208 15 1.5 11.9779 1.5 8.25Z"
                      fill="#637381"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M11.957 11.958C12.2499 11.6651 12.7247 11.6651 13.0176 11.958L16.2801 15.2205C16.573 15.5133 16.573 15.9882 16.2801 16.2811C15.9872 16.574 15.5124 16.574 15.2195 16.2811L11.957 13.0186C11.6641 12.7257 11.6641 12.2508 11.957 11.958Z"
                      fill="#637381"
                    />
                  </svg>
                </button>
              </form>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-auto">
              <div className="space-y-0">
                {loadingChats && (
                  <div className="text-gray-500 dark:text-gray-400 p-6 text-center">
                    {t('loading_chats')}
                  </div>
                )}
                {(pollChats?.items || chats?.items || []).map((chat) => {
                  // El título será el abstract, si no existe, fallback a los otros campos
                  const chatTitle =
                    chat.abstract ||
                    chat.last_detected_model ||
                    chat.last_detected_part ||
                    chat.lang ||
                    chat.store_domain;
                  // Inicial del nombre del usuario que creó el chat
                  // Primero intenta conversation_customer.name, si no existe, usa solo la primera letra del customer_id como fallback
                  let userInitial = 'U'; // Default
                  if (
                    chat.conversation_customer &&
                    chat.conversation_customer.name
                  ) {
                    userInitial = chat.conversation_customer.name
                      .charAt(0)
                      .toUpperCase();
                  } else if (chat.customer_id) {
                    // Si no hay conversation_customer, usa la primera letra del customer_id
                    userInitial = chat.customer_id.charAt(0).toUpperCase();
                  }

                  return (
                    <div
                      key={chat.id}
                      className={`flex cursor-pointer items-center border-b border-stroke px-6 py-3 transition-colors hover:bg-gray-2 dark:border-strokedark dark:hover:bg-boxdark-2 ${
                        selectedChat?.id === chat.id
                          ? 'bg-gray-2 dark:bg-boxdark-2'
                          : ''
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-800 relative mr-3.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border">
                        <span className="text-sm font-medium text-black dark:text-white">
                          {userInitial}
                        </span>
                        <span className="dark:border-gray-800 absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white bg-success"></span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="truncate text-sm font-medium text-black dark:text-white">
                          {chatTitle}
                        </h5>
                        <p className="text-gray-500 dark:text-gray-400 truncate text-xs">
                          Pronto Mowers
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chat Box */}
          <div className="flex h-full min-h-0 w-full flex-1 flex-col border-l border-stroke dark:border-strokedark">
            {selectedChat?.id && chatDetail ? (
              <>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stroke bg-white px-6 py-3 text-black dark:border-strokedark dark:bg-boxdark dark:text-white">
                  <div className="flex items-center">
                    <div className="bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-800 mr-3.5 flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border">
                      <span className="text-lg font-medium text-black dark:text-white">
                        {customerData?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-black dark:text-white">
                        {customerData?.name || t('user_no_name')}
                      </h5>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Pronto Mowers
                      </p>
                    </div>
                  </div>
                  <div>
                    <DropdownDefault />
                  </div>
                </div>

                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="flex-1 space-y-3.5 overflow-auto px-6 py-7.5">
                    {loadingDetail && (
                      <div className="flex justify-center py-8">
                        <span className="text-gray-500 dark:text-gray-400">
                          Loading conversation...
                        </span>
                      </div>
                    )}
                    {chatDetail?.conversation_message &&
                      chatDetail.conversation_message.length > 0 &&
                      (() => {
                        let lastDate = '';
                        return chatDetail.conversation_message.map(
                          (msg, msgIndex) => {
                            // Detectar automáticamente si el mensaje tiene tabla/acordeón
                            let hasTable = false;
                            if (msg.role === 'assistant') {
                              // 1. Si viene el flag table o hay table_data estructurado
                              if (
                                msg.table === true ||
                                (msg.table_data &&
                                  msg.table_data.partInfo &&
                                  Array.isArray(msg.table_data.partInfo))
                              ) {
                                hasTable = true;
                                console.log(
                                  '[hasTable detection] Flag msg.table === true or structured table_data found'
                                );
                              } else if (typeof msg.content === 'string') {
                                const trimmed = msg.content.trim();

                                // 2. Si contiene el patrón _____{'partInfo':...} - PRIORITY: check FIRST
                                if (
                                  msg.content.includes('_____') &&
                                  msg.content.includes('partInfo')
                                ) {
                                  hasTable = true;
                                  console.log(
                                    '[hasTable detection] ✅ Embedded partInfo pattern detected'
                                  );
                                }
                                // 3. Si incluye el separador antiguo
                                else if (msg.content.includes('--------')) {
                                  hasTable = true;
                                  console.log(
                                    '[hasTable detection] Separator "--------" found'
                                  );
                                }
                                // 4. Si el string STARTS with [ (pure JSON array) - must start AND end with [ ]
                                else if (
                                  trimmed.startsWith('[') &&
                                  trimmed.endsWith(']')
                                ) {
                                  // Additional check: must contain { to be array of objects
                                  if (trimmed.includes('{')) {
                                    hasTable = true;
                                    console.log(
                                      '[hasTable detection] ✅ Array pattern detected'
                                    );
                                  }
                                }
                                // 5. Si el string STARTS with { (pure JSON object) - must start AND end with { }
                                else if (
                                  trimmed.startsWith('{') &&
                                  trimmed.endsWith('}')
                                ) {
                                  // Additional check: must contain typical part fields
                                  if (
                                    trimmed.includes('partNumber') ||
                                    trimmed.includes('related_parts') ||
                                    trimmed.includes('general_info') ||
                                    trimmed.includes('MFRID') ||
                                    trimmed.includes('PARTNUMBER')
                                  ) {
                                    hasTable = true;
                                    console.log(
                                      '[hasTable detection] Object pattern detected'
                                    );
                                  }
                                } else {
                                  console.log(
                                    '[hasTable detection] ❌ No pattern match. Content starts with:',
                                    trimmed.substring(0, 50)
                                  );
                                }
                              }
                            }
                            // Parsear el content pasando el tableData del mensaje
                            const { text, tableData } = hasTable
                              ? parseMessageContent(
                                  msg.content,
                                  hasTable,
                                  msg.table_data
                                )
                              : { text: msg.content, tableData: null };

                            // Si hasTable es true y el text está vacío o es solo JSON, no mostrar texto
                            const shouldRenderText =
                              !hasTable ||
                              (text &&
                                text.trim().length > 0 &&
                                !text.trim().startsWith('[') &&
                                !text.trim().startsWith('{'));

                            console.log(
                              '[Render] hasTable:',
                              hasTable,
                              '| tableData type:',
                              Array.isArray(tableData)
                                ? `Array[${tableData.length}]`
                                : typeof tableData,
                              '| shouldRenderText:',
                              shouldRenderText
                            );
                            if (msg.table_data) {
                              console.log(
                                '[Render] msg.table_data present:',
                                typeof msg.table_data,
                                msg.table_data.partInfo
                                  ? `partInfo[${msg.table_data.partInfo.length}]`
                                  : 'no partInfo'
                              );
                            }

                            // Custom message for 'No answer found'
                            let content = text;
                            if (
                              msg.role === 'assistant' &&
                              content &&
                              content.trim().toLowerCase() === 'no answer found'
                            ) {
                              content =
                                'Thank you for your rating and feedback! Your input helps us improve our service.';
                            }

                            const msgDate = formatDate(msg.createdAt);
                            const showDate = msgDate !== lastDate;
                            lastDate = msgDate;
                            const previousUserMessage = (() => {
                              for (let i = msgIndex - 1; i >= 0; i -= 1) {
                                if (
                                  chatDetail.conversation_message[i]?.role ===
                                  'user'
                                ) {
                                  return (
                                    chatDetail.conversation_message[i]
                                      ?.content || ''
                                  );
                                }
                              }
                              return '';
                            })();
                            return (
                              <React.Fragment key={msg.id}>
                                {showDate && (
                                  <div className="my-4 flex justify-center">
                                    <span className="bg-gray-100 text-gray-600 dark:text-gray-400 border-gray-200 rounded-full border px-3 py-1 text-xs dark:bg-boxdark-2">
                                      {msgDate}
                                    </span>
                                  </div>
                                )}
                                <div
                                  className={
                                    msg.role === 'user'
                                      ? 'flex justify-end'
                                      : 'flex justify-start'
                                  }
                                >
                                  <div
                                    className={
                                      msg.role === 'user'
                                        ? 'max-w-md'
                                        : 'max-w-full'
                                    }
                                  >
                                    {msg.role === 'user' && (
                                      <p className="text-gray-600 dark:text-gray-400 mb-2 text-xs font-medium">
                                        {customerData?.name || t('user')}
                                      </p>
                                    )}
                                    {msg.role === 'assistant' && (
                                      <div className="mb-2 flex items-center justify-between gap-2">
                                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                          {t('assistant')}
                                        </p>
                                        {(content || text || '').trim().length >
                                          0 && (
                                          <button
                                            type="button"
                                            title="Guardar"
                                            className="rounded p-1 text-blue-700 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-boxdark"
                                            onClick={() => {
                                              setQaInitialAnswer(
                                                content || text || ''
                                              );
                                              setQaInitialQuestion(
                                                previousUserMessage
                                              );
                                              setQaModalOpen(true);
                                            }}
                                          >
                                            <svg
                                              width="16"
                                              height="16"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path
                                                d="M5 3H16L20 7V21H5V3Z"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M8 3V9H16V3"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M9 21V14H15V21"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    <div
                                      className={`rounded-2xl border px-4 py-3 shadow-md ${
                                        msg.role === 'user'
                                          ? 'border-blue-700 bg-blue-600 text-white'
                                          : 'border-blue-300 bg-white text-blue-900 dark:bg-boxdark-2 dark:text-white'
                                      }`}
                                    >
                                      {shouldRenderText && (
                                        <p className="break-words text-[105%] text-sm">
                                          {renderMessageContent(text, msg.role)}
                                        </p>
                                      )}
                                      {/* Mostrar acordeón si tableData es array, si no usar tabla legacy */}
                                      {msg.role === 'assistant' &&
                                      tableData &&
                                      Array.isArray(tableData) ? (
                                        <PartsAccordion
                                          data={tableData}
                                          messageId={msg.id}
                                        />
                                      ) : msg.role === 'assistant' &&
                                        tableData ? (
                                        <TableCollapsible
                                          tableData={tableData}
                                          messageId={msg.id}
                                          isExpanded={
                                            expandedTableId === msg.id
                                          }
                                          onToggle={() =>
                                            setExpandedTableId(
                                              expandedTableId === msg.id
                                                ? null
                                                : msg.id
                                            )
                                          }
                                        />
                                      ) : null}
                                    </div>
                                    <div
                                      className={`text-gray-500 dark:text-gray-400 mt-1 text-xs ${
                                        msg.role === 'user'
                                          ? 'text-right'
                                          : 'text-left'
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-center gap-3">
                                        <span>
                                          {new Date(
                                            msg.createdAt
                                          ).toLocaleTimeString()}
                                        </span>
                                        {/* Mostrar conversation_context si existe en el mensaje */}
                                        {msg.role === 'assistant' &&
                                          msg.conversation_context && (
                                            <div className="text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                              {msg.conversation_context
                                                .intent && (
                                                <span>
                                                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                                                    {t(
                                                      'conversation_context.intent'
                                                    )}
                                                    :
                                                  </span>{' '}
                                                  {
                                                    msg.conversation_context
                                                      .intent
                                                  }
                                                </span>
                                              )}
                                              {msg.conversation_context.mfr && (
                                                <span>
                                                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                                                    {t(
                                                      'conversation_context.manufacturer'
                                                    )}
                                                    :
                                                  </span>{' '}
                                                  {msg.conversation_context.mfr}
                                                </span>
                                              )}
                                              {msg.conversation_context
                                                .model && (
                                                <span>
                                                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                                                    {t(
                                                      'conversation_context.model'
                                                    )}
                                                    :
                                                  </span>{' '}
                                                  {
                                                    msg.conversation_context
                                                      .model
                                                  }
                                                </span>
                                              )}
                                              {msg.conversation_context
                                                .serial && (
                                                <span>
                                                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                                                    {t(
                                                      'conversation_context.serial'
                                                    )}
                                                    :
                                                  </span>{' '}
                                                  {
                                                    msg.conversation_context
                                                      .serial
                                                  }
                                                </span>
                                              )}
                                              {msg.conversation_context
                                                .part && (
                                                <span>
                                                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                                                    {t(
                                                      'conversation_context.component'
                                                    )}
                                                    :
                                                  </span>{' '}
                                                  {
                                                    msg.conversation_context
                                                      .part
                                                  }
                                                </span>
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          }
                        );
                      })()}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input fijo abajo (deshabilitado) */}
                  <div className="sticky bottom-0 z-10 border-t border-stroke bg-white px-6 py-5 dark:border-strokedark dark:bg-boxdark">
                    <form className="flex items-center justify-between space-x-4">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder={t('type_message')}
                          className="placeholder-gray-500 dark:placeholder-gray-400 h-12 w-full cursor-not-allowed rounded-md border border-stroke bg-gray-2 pl-5 pr-12 text-sm text-black outline-none focus:border-primary dark:bg-boxdark-2 dark:text-white"
                          disabled
                        />
                      </div>
                      <button
                        className="bg-gray-300 flex h-12 w-12 flex-shrink-0 cursor-not-allowed items-center justify-center rounded-md text-white transition-all"
                        disabled
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M22 2L11 13"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M22 2L15 22L11 13L2 9L22 2Z"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <svg
                    className="text-gray-400 dark:text-gray-600 mx-auto mb-4 h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('select_chat')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <QuestionsAnswersModal
        isOpen={qaModalOpen}
        initialQuestion={qaInitialQuestion}
        initialAnswer={qaInitialAnswer}
        onClose={() => setQaModalOpen(false)}
      />
    </DefaultLayout>
  );
};

export default Messages;
