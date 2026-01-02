import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DropdownDefault from '../components/Dropdowns/DropdownDefault';
import DefaultLayout from '../layout/DefaultLayout';
import { useMyConversationsPaginated, useMyConversationById } from '../hooks/useConversation';
import { getMyConversationsPaginated } from '../libs/ConversationService';
import { format } from 'date-fns';
// import { es } from 'date-fns/locale/es'; // Unused
import { useUserProfile } from '../hooks/useUser';
import { sendMessageToConversationService } from '../libs/ConversationService';
import { RatingBubble, RatingType } from '../components/RatingBubble';
import { useRating } from '../hooks/useRating';

// Helper functions
const formatDate = (date: string) => {
  return format(new Date(date), 'MMMM d, yyyy');
};

// Helper para extraer texto y tabla del content
const parseMessageContent = (content: string, hasTable: boolean) => {
  if (!hasTable) {
    return { text: content, tableData: null };
  }

  // Nuevo formato: si el content es un JSON válido con un campo answer que es un array o un string que parece un array
  try {
    let parsed: any = null;
    if (typeof content === 'string') {
      // Intenta parsear como JSON
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        // Si falla, intenta reemplazar comillas simples por dobles y None por null
        const fixed = content.replace(/'/g, '"').replace(/None/g, 'null');
        parsed = JSON.parse(fixed);
      }
    } else {
      parsed = content;
    }

    // Si tiene answer tipo array o string que parece array
    if (parsed && parsed.answer && (Array.isArray(parsed.answer) || (typeof parsed.answer === 'string' && parsed.answer.trim().startsWith('[')))) {
      let answerArr = parsed.answer;
      if (typeof answerArr === 'string') {
        // Normaliza el string a JSON válido
        answerArr = answerArr.replace(/'/g, '"').replace(/None/g, 'null');
        answerArr = JSON.parse(answerArr);
      }
      return { text: '', tableData: answerArr };
    }

    // Fallback: lógica anterior
    // Buscar el separador de 8 guiones que precede al JSON
    const separatorIndex = content.indexOf('--------');
    if (separatorIndex !== -1) {
      const text = content.substring(0, separatorIndex).trim();
      const jsonPart = content.substring(separatorIndex + 8).trim();
      try {
        const jsonString = jsonPart.replace(/'/g, '"').replace(/None/g, 'null');
        const tableData = JSON.parse(jsonString);
        return { text, tableData };
      } catch (parseError) {
        return { text: content, tableData: null };
      }
    }

    // Fallback: intentar parsear el JSON completo del content
    return {
      text: parsed.answer || parsed.text || '',
      tableData: parsed.table || parsed
    };
  } catch (e) {
    // Si todo falla, buscar el JSON dentro del string con regex
    const jsonMatch = content.match(/\{[\s\S]*"generalInfo"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const jsonString = jsonMatch[0].replace(/'/g, '"').replace(/None/g, 'null');
        const tableData = JSON.parse(jsonString);
        const text = content.replace(jsonMatch[0], '').replace(/--------/g, '').trim();
        return { text, tableData };
      } catch (parseError) {
        return { text: content, tableData: null };
      }
    }
    return { text: content, tableData: null };
  }
};

// Formatea los mensajes del assistant para saltos de línea y URLs
const renderMessageContent = (content: string, role?: string) => {
  if (role === 'assistant') {
    // Regex for Markdown links: [text](url)
    const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+[\w/])\)/g;
    // Regex for plain URLs
    const urlRegex = /(https?:\/\/[^\s)]+[\w/])/g;
    // Split by line breaks first
    return content.split(/\n|\r\n/).map((line, idx) => {
      // First, replace Markdown links with anchor tags
      let parts: (string | JSX.Element)[] = [];
      let lastIdx = 0;
      let match;
      while ((match = mdLinkRegex.exec(line)) !== null) {
        if (match.index > lastIdx) {
          parts.push(line.slice(lastIdx, match.index));
        }
        parts.push(
          <a
            key={match[2] + idx}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-all"
          >
            {match[1]}
          </a>
        );
        lastIdx = match.index + match[0].length;
      }
      if (lastIdx < line.length) {
        parts.push(line.slice(lastIdx));
      }
      // Now, for any remaining plain URLs in the string parts, parse as before
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
                className="underline break-all"
              >
                {isPdf ? 'Download file' : 'Open link'}
              </a>
            );
          }
          return sub;
        });
      });
      return <React.Fragment key={idx}>{parts}<br /></React.Fragment>;
    });
  }
  // Usuario: solo texto plano
  return content;
};


// Nuevo componente: PartsAccordion
const PartsAccordion: React.FC<{ data: any[]; messageId: string }> = ({ data, messageId }) => {
  const { t } = useTranslation();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  if (!Array.isArray(data)) return null;
  // Helper to copy part number
  const handleCopy = (partNumber: string, idx: number) => {
    if (!partNumber) return;
    navigator.clipboard.writeText(partNumber);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };
  return (
    <div className="mt-3 max-w-4xl mx-auto">
      {data.map((item, idx) => {
        const general = item.general_info || {};
        const relatedParts = item.related_parts || [];
        const mfrId = general.MFRID || item.mfrId || '-';
        const partNumber = general.PARTNUMBER || item.partNumber || '-';
        const description = general.DESCRIPTION || '-';
        const ubicacion = item.location || '-';
        const superseded = item.superseded || general.SUPERCEDETO || '-';
        const cantidad = item.qty_loc ?? general.QTY_LOC ?? '-';
        return (
          <div key={idx} className="mb-4 border border-stroke dark:border-strokedark rounded-lg overflow-hidden shadow-sm bg-white dark:bg-boxdark max-w-4xl mx-auto">
            {/* Header del acordeón */}
            <div className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-boxdark-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors border-b border-stroke dark:border-strokedark">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {item.productThumbnailImage && item.productThumbnailImage.startsWith('http') && (
                  <img src={item.productThumbnailImage} alt="thumb" className="w-10 h-10 object-contain rounded border" />
                )}
                <div className="flex flex-col min-w-0 flex-1">
                  {/* Primera línea: MFRID PARTNUMBER DESCRIPTION (sin separador) */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <span className="truncate">{mfrId}</span>
                    <span className="truncate">{partNumber}</span>
                    <span className="truncate flex-1">{description}</span>
                  </div>
                  {/* Segunda línea: Location y Superseded a la izquierda */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="truncate">{t('parts_accordion.location')}: {ubicacion ?? '-'}</span>
                    <span className="truncate">{t('parts_accordion.superseded')}: {superseded && superseded !== '' ? superseded : '-'}</span>
                  </div>
                </div>
              </div>
              {/* Quantity alineado a la derecha en su propia columna */}
              <div className="flex flex-col items-end justify-center mr-2 ml-3">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{t('parts_accordion.quantity')}: {cantidad ?? '-'}</span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {/* Copy button */}
                <button
                  type="button"
                  className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 border border-transparent focus:outline-none"
                  title={t('parts_accordion.copy_part_number')}
                  onClick={() => handleCopy(partNumber, idx)}
                >
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                    <rect x="3" y="3" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                  </svg>
                </button>
                {copiedIdx === idx && (
                  <span className="text-xs text-green-600 dark:text-green-400 ml-1">{t('parts_accordion.copied')}</span>
                )}
                {/* Expand/collapse button */}
                <button
                  type="button"
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-meta-4 border border-transparent focus:outline-none"
                  title={expandedIdx === idx ? 'Close' : 'Open'}
                >
                  <svg
                    className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${expandedIdx === idx ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Contenido expandido */}
            {expandedIdx === idx && (
              <div className="p-4">
                {item.productStandarImage && item.productStandarImage.startsWith('http') && (
                  <div className="mb-3 flex justify-center">
                    <img src={item.productStandarImage} alt="main" className="max-h-40 object-contain rounded border" />
                  </div>
                )}
                {/* Mostrar superseded_list alineado a la izquierda, con título, si tiene valores válidos */}
                {Array.isArray(item.superseded_list) && item.superseded_list.filter(x => x && x !== 'null' && x !== null).length > 0 && (
                  <div className="mb-3 text-xs text-gray-700 dark:text-gray-300 text-left">
                    <span className="font-semibold">{t('parts_accordion.superseded_list')}:</span> {item.superseded_list.filter(x => x && x !== 'null' && x !== null).join('  >>  ')}
                  </div>
                )}
                {/* Título de la tabla */}
                {relatedParts && relatedParts.length > 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{t('parts_accordion.related_products')}</div>
                )}
                {/* Tabla de partes relacionadas */}
                {relatedParts && relatedParts.length > 0 && (
                  <div className="overflow-x-auto min-w-[600px]">
                    <table className="w-full text-xs border border-stroke dark:border-strokedark">
                      <thead className="bg-white dark:bg-boxdark">
                        <tr>
                          <th className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">{t('parts_accordion.mfr_id')}</th>
                          <th className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">{t('parts_accordion.part_number')}</th>
                          <th className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">{t('parts_accordion.description')}</th>
                          <th className="px-2 py-1 text-right font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">{t('parts_accordion.qty')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-boxdark">
                        {relatedParts.map((part: any, pidx: number) => (
                          <tr key={pidx} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-boxdark-2">
                            <td className="px-2 py-1 text-gray-900 dark:text-white">{part.MFRID || '-'}</td>
                            <td className="px-2 py-1 text-gray-900 dark:text-white">{part.PARTNUMBER || '-'}</td>
                            <td className="px-2 py-1 text-gray-900 dark:text-white">{part.DESCRIPTION || '-'}</td>
                            <td className="px-2 py-1 text-right text-gray-900 dark:text-white min-w-[60px]">{part.QUANTITYLOC ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Si no hay partes relacionadas */}
                {(!relatedParts || relatedParts.length === 0) && (
                  <div className="text-xs text-gray-500 mt-2">{t('parts_accordion.no_related_parts')}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Componente para renderizar la tabla desplegable (formato antiguo)
const TableCollapsible: React.FC<{ 
  tableData: any; 
  messageId: string; 
  isExpanded: boolean; 
  onToggle: () => void 
}> = ({ tableData, isExpanded, onToggle }) => {
  const { t } = useTranslation();
  // Si table es false o "error", no mostrar nada
  if (tableData === false || tableData === 'error' || !tableData) return null;

  const { generalInfo, relatedParts } = tableData;

  return (
    <div className="mt-3 border border-stroke dark:border-strokedark rounded-lg overflow-hidden shadow-sm bg-white dark:bg-boxdark max-w-3xl mx-auto">
      {/* Header clickeable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-boxdark-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors border-b border-stroke dark:border-strokedark"
      >
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          📊 {t('parts_accordion.parts_information')}
        </span>
        <svg
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Tabla desplegable */}
      {isExpanded && (
        <div className="overflow-auto max-h-[500px]">
          {/* General Info como tabla principal */}
          {generalInfo && (
            <div className="overflow-x-auto min-w-[600px]">
              <table className="w-full table-auto border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-boxdark-2 border-b border-stroke dark:border-strokedark">
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">{t('parts_accordion.mfr_id')}</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">{t('parts_accordion.part_number')}</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">{t('parts_accordion.description')}</th>
                    {generalInfo.SUPERCEDETO && (
                      <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">{t('parts_accordion.superseded')}</th>
                    )}
                    <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{t('parts_accordion.qty')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-boxdark-2">
                    <td className="px-2 py-2 text-gray-900 dark:text-white">{generalInfo.MFRID || '-'}</td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white">{generalInfo.PARTNUMBER || '-'}</td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white">{generalInfo.DESCRIPTION || '-'}</td>
                    {generalInfo.SUPERCEDETO && (
                      <td className="px-2 py-2 text-gray-900 dark:text-white font-medium text-blue-600 dark:text-blue-400">
                        {generalInfo.SUPERCEDETO}
                      </td>
                    )}
                    <td className="px-2 py-2 text-right text-gray-900 dark:text-white">{generalInfo.QTY_LOC ?? '-'}</td>
                  </tr>
                  {/* Related Parts como filas expandidas */}
                  {relatedParts && relatedParts.length > 0 && (
                    <tr>
                      <td colSpan={4} className="bg-gray-50 dark:bg-boxdark-2 px-3 py-3">
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                            {t('parts_accordion.related_products')} ({relatedParts.length})
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border border-stroke dark:border-strokedark">
                            <thead className="bg-white dark:bg-boxdark">
                              <tr>
                                <th className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                                  {t('parts_accordion.mfr_id')}
                                </th>
                                <th className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                                  {t('parts_accordion.part_number')}
                                </th>
                                <th className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                                  {t('parts_accordion.description')}
                                </th>
                                <th className="px-2 py-1 text-right font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                                  {t('parts_accordion.qty')}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-boxdark">
                              {relatedParts.map((part: any, idx: number) => (
                                <tr
                                  key={idx}
                                  className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-boxdark-2"
                                >
                                  <td className="px-2 py-1 text-gray-900 dark:text-white">
                                    {part.MFRID || '-'}
                                  </td>
                                  <td className="px-2 py-1 text-gray-900 dark:text-white">
                                    {part.PARTNUMBER || '-'}
                                  </td>
                                  <td className="px-2 py-1 text-gray-900 dark:text-white">
                                    {part.DESCRIPTION || '-'}
                                  </td>
                                  <td className="px-2 py-1 text-right text-gray-900 dark:text-white">
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

const MessagesMe: React.FC = () => {
  const { t } = useTranslation();
  // Search state for chat list
  const [searchTerm, setSearchTerm] = useState('');
  // State para controlar qué tabla está abierta (por message id)
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);
  // Animación CSS para los puntos de typing
  const typingDotsStyle = `
    @keyframes chat-typing {
      0% { opacity: 0.2; }
      20% { opacity: 1; }
      100% { opacity: 0.2; }
    }
    .chat-typing-dots {
      display: inline-flex;
      gap: 4px;
      height: 1em;
      align-items: center;
    }
    .chat-typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #888;
      opacity: 0.2;
      animation: chat-typing 1.2s infinite;
    }
    .chat-typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    .chat-typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }
  `;
  const { profile: userProfile } = useUserProfile();
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  // typing: true solo mientras espera respuesta del backend
  // const [typing, setTyping] = useState(false); // Unused

  // Hook para crear conversación
  // const { conversation, loading: loadingCreate, error: errorCreate, handleCreateConversation } = useConversation(); // Unused

  // Hooks para mis conversaciones
  const { data: chats, loading: loadingChats } = useMyConversationsPaginated({ page, limit });
  const [pollChats, setPollChats] = useState<any>(null);

  // Polling: refresh chats every 5 seconds
  useEffect(() => {
    let ignore = false;
    const poll = async () => {
      try {
        const result = await getMyConversationsPaginated(page, limit);
        if (!ignore) setPollChats(result);
      } catch (e) {
        // ignore polling errors
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => { ignore = true; clearInterval(interval); };
  }, [page, limit]);

  // Polling: refresh chats every 5 seconds
  // (Obsolete polling code removed)
  // Filtered chats based on search
  const filteredChats = (pollChats?.items || chats?.items || []).filter(chat => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      chat.store_domain?.toLowerCase().includes(term) ||
      chat.last_detected_model?.toLowerCase().includes(term) ||
      chat.last_detected_part?.toLowerCase().includes(term) ||
      chat.lang?.toLowerCase().includes(term)
    );
  }) ?? [];
  // Solo obtener detalles si el chat es existente
  const conversationId = selectedChat && !selectedChat.isNew ? (selectedChat?.id || selectedChat?.conversation_id || '') : '';
  const { data: chatDetail, loading: loadingDetail } = useMyConversationById(conversationId);

  // Ref para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  // Mensajes locales que aún no han sido confirmados por el backend
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  // Estado de error para mostrar mensajes de error
  const [error, setError] = useState<string | null>(null);
  // Efecto typing del assistant
  const [assistantTyping, setAssistantTyping] = useState(false);
  // Rating state
  const { submitRating, loading: ratingLoading, error: ratingError } = useRating();
  const [showRatingBubble, setShowRatingBubble] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  // Scroll automático cada vez que cambian los mensajes (locales o backend)
  useEffect(() => {
    scrollToBottom();
  }, [chatDetail?.conversation_message, localMessages, assistantTyping]);

  // Scroll to bottom when rating modal appears
  useEffect(() => {
    if (showRatingBubble) {
      scrollToBottom();
    }
  }, [showRatingBubble]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // Crear nueva conversación al seleccionar 'New Chat' (solo UI, sin request)
  const handleNewChat = () => {
    const userName = userProfile?.firstName || userProfile?.name || '';
    setSelectedChat(null);
    setLocalMessages([]);
    setAssistantTyping(false);
    setTimeout(() => {
      setSelectedChat({ id: 'new', isNew: true });
      setLocalMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: t('welcome', { userName }),
          createdAt: new Date().toISOString(),
        }
      ]);
    }, 0);
  };

  const handleTyping = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const message = inputValue.trim();
      if (message) {
        handleSubmit(message);
      }
    }
  };

  // Enviar mensaje o crear conversación
  const sendMessageToConversation = async (payload: {
    customer_id: string;
    question: string;
    lang: string;
    store_domain: string;
    conversation_id?: string;
  }) => {
    // Si conversation_id existe, lo incluye; si no, crea nueva conversación
    return await sendMessageToConversationService(payload);
  };

  const handleSubmit = async (message?: string) => {
    try {
      const messageContent = message || inputValue.trim();
      if (!messageContent) return;

      // DEBUG: Mensaje que se va a enviar
      console.log('[DEBUG] handleSubmit - messageContent:', messageContent);
      console.log('[DEBUG] selectedChat:', selectedChat);
      console.log('[DEBUG] userProfile:', userProfile);

      // Mostrar el mensaje del usuario inmediatamente
      setLocalMessages(prev => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          role: 'user',
          content: messageContent,
          createdAt: new Date().toISOString(),
        }
      ]);
      setInputValue('');
      setAssistantTyping(true);

      let apiResponse = null;

      if (selectedChat?.isNew && selectedChat?.id === 'new') {
        // Usar el customer_id guardado en localStorage
        const customerId = localStorage.getItem('customer_id');
        console.log('[DEBUG] Nuevo chat - customerId (localStorage):', customerId);
        if (!customerId || typeof customerId !== 'string' || customerId.length !== 36) {
          setLocalMessages(prev => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: 'Error: No se pudo obtener el ID de usuario para crear la conversación.',
              createdAt: new Date().toISOString(),
            }
          ]);
          setAssistantTyping(false);
          return;
        }
        // Enviar la petición correctamente
        try {
          // Asegura que lang sea BCP 47 válido
          let lang = navigator.language || 'en-US';
          if (typeof lang !== 'string' || !lang.match(/^[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})?$/)) {
            lang = 'en-US';
          }
          const payload = {
            customer_id: customerId,
            question: messageContent,
            lang,
            store_domain: 'www.smallenginesprodealer.com',
          };
          console.log('[DEBUG] Nuevo chat - payload:', payload);
          const result = await sendMessageToConversation(payload);
          console.log('[DEBUG] Nuevo chat - API result:', result);
          apiResponse = result;
          if (result && result.conversation_id) {
            setSelectedChat({
              id: result.conversation_id,
              store_domain: result.store_domain || 'www.smallenginesprodealer.com',
            });
          }
        } catch (err) {
          console.error('[DEBUG] Nuevo chat - API error:', err);
          setLocalMessages(prev => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: err?.message === 'Request timed out after 1 minute'
                ? 'Error: El chat tardó demasiado en responder. Inténtalo de nuevo.'
                : 'Error, inténtalo de nuevo.',
              createdAt: new Date().toISOString(),
            }
          ]);
        }
      } else if (selectedChat?.id) {
        // Retomar conversación existente y enviar mensaje
        try {
          const payload = {
            customer_id: chatDetail?.customer_id ?? '',
            question: messageContent,
            lang: chatDetail?.lang || navigator.language || 'en-US',
            store_domain: chatDetail?.store_domain || 'www.smallenginesprodealer.com',
            conversation_id: selectedChat.id,
          };
          apiResponse = await sendMessageToConversation(payload);
        } catch (err) {
          console.error('[DEBUG] Retomar chat - API error:', err);
          setLocalMessages(prev => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: err?.message === 'Request timed out after 1 minute'
                ? 'Error: El chat tardó demasiado en responder. Inténtalo de nuevo.'
                : 'Error, inténtalo de nuevo.',
              createdAt: new Date().toISOString(),
            }
          ]);
        }
      }

      // Mostrar el mensaje del assistant si hay answer
      if (apiResponse && apiResponse.answer) {
        setLocalMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: apiResponse.answer,
            table: apiResponse.table || false, // Boolean que indica si hay tabla en el content
            createdAt: new Date().toISOString(),
          }
        ]);
      }

      // Mostrar el modal de calificación si close_chat viene en true, aunque answer esté vacío
      if (apiResponse && apiResponse.close_chat === true) {
        setTimeout(() => {
          setConversationEnded(true);
          setShowRatingBubble(true);
        }, 1000);
      }

      // Cuando la respuesta llegue y chatDetail se actualice, borra los mensajes locales
      if (apiResponse) {
        setAssistantTyping(false);
        // Deja los mensajes locales hasta que el backend actualice la conversación
        // (no borres los mensajes locales aquí)
      } else {
        setAssistantTyping(false);
        // Si no hubo respuesta, no borres los mensajes locales (ya se muestra error)
      }
    } catch (error) {
      setAssistantTyping(false);
      setLocalMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Error, inténtalo de nuevo.',
          createdAt: new Date().toISOString(),
        }
      ]);
      console.error('[DEBUG] handleSubmit - error:', error);
    }
  };

  // Handler for rating submission
  function handleRatingSubmit(rating: RatingType, comment?: string) {
    submitRating({
      conversation_id: conversationId,
      rating,
      comment,
    });
    setRatingSubmitted(true);
    setShowRatingBubble(false);
    setConversationEnded(false);
    setLocalMessages([{
      id: `thanks-${Date.now()}`,
      role: 'assistant',
      content: 'Thank you for your feedback!',
      createdAt: new Date().toISOString(),
    }]);
  }

  useEffect(() => {
    // Si la conversación cambia, borra los mensajes locales, el efecto typing y oculta el rating bubble
    setShowRatingBubble(false);
    setConversationEnded(false);
    if (!assistantTyping) {
      setLocalMessages([]);
      setAssistantTyping(false);
    }
    // Si assistantTyping está activo, no borres los mensajes locales ni la animación
  }, [conversationId]);

  return (
    <DefaultLayout>
  <Breadcrumb pageName={t('my_chats')} />
      {/* Mostrar error si existe */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-2 text-center">
          {error}
        </div>
      )}
      <div className="h-[calc(100vh-186px)] overflow-hidden sm:h-[calc(100vh-174px)]">
        <div className="h-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark xl:flex">
          {/* Chat List */}
          <div className="hidden h-full flex-col xl:flex xl:w-1/4 bg-white dark:bg-boxdark border-r-2 border-blue-300">
            {/* Header */}
            <div className="border-b border-stroke dark:border-strokedark px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-black dark:text-white whitespace-nowrap">
                  {t('my_chats')} <span className="text-xs ml-1">{chats?.totalItems ?? 0}</span>
                </h4>
                <button
                  onClick={handleNewChat}
                  className="inline-flex items-center justify-center rounded-lg bg-primary py-2 px-2.5 sm:px-4 text-sm font-medium text-white hover:bg-opacity-90 transition-all"
                >
                  <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline whitespace-nowrap">{t('new_chat')}</span>
                  <span className="inline sm:hidden">{t('new_chat')}</span>
                </button>
              </div>
            </div>
            {/* Chats per page selector */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 border-b border-stroke dark:border-strokedark">
              <label htmlFor="limit" className="text-sm font-medium text-black dark:text-white whitespace-nowrap">
                {t('show_last')}
              </label>
              <select
                id="limit"
                value={limit}
                onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                className="ml-2 rounded border border-stroke bg-white dark:bg-boxdark-2 dark:border-strokedark px-2 py-1 text-sm dark:text-white"
              >
                {[5, 10, 20, 50].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            {/* Search */}
            <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-stroke dark:border-strokedark">
              <form className="relative" onSubmit={e => e.preventDefault()}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full rounded border border-stroke bg-gray-2 dark:bg-boxdark-2 py-2 sm:py-2.5 pl-4 sm:pl-5 pr-10 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                  placeholder={t('search')}
                  disabled={loadingChats}
                />
                <button type="submit" className="absolute top-1/2 right-4 -translate-y-1/2">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M8.25 3C5.3505 3 3 5.3505 3 8.25C3 11.1495 5.3505 13.5 8.25 13.5C11.1495 13.5 13.5 11.1495 13.5 8.25C13.5 5.3505 11.1495 3 8.25 3ZM1.5 8.25C1.5 4.52208 4.52208 1.5 8.25 1.5C11.9779 1.5 15 4.52208 15 8.25C15 11.9779 11.9779 15 8.25 15C4.52208 15 1.5 11.9779 1.5 8.25Z" fill="#637381" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M11.957 11.958C12.2499 11.6651 12.7247 11.6651 13.0176 11.958L16.2801 15.2205C16.573 15.5133 16.573 15.9882 16.2801 16.2811C15.9872 16.574 15.5124 16.574 15.2195 16.2811L11.957 13.0186C11.6641 12.7257 11.6641 12.2508 11.957 11.958Z" fill="#637381" />
                  </svg>
                </button>
              </form>
            </div>
            {/* Chat list */}
            <div className="flex-1 overflow-auto">
              <div className="space-y-0">
                {loadingChats && (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    {t('loading_chats')}
                  </div>
                )}
                {filteredChats.map((chat) => {
                  // El título será el abstract, si no existe, fallback a los otros campos
                  const chatTitle = chat.abstract || chat.last_detected_model || chat.last_detected_part || chat.lang || chat.store_domain;
                  return (
                    <div
                      key={chat.id}
                      className={`flex cursor-pointer items-center border-b border-stroke dark:border-strokedark py-3 px-6 hover:bg-gray-2 dark:hover:bg-boxdark-2 transition-colors ${
                        selectedChat?.id === chat.id ? 'bg-gray-2 dark:bg-boxdark-2' : ''
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="relative mr-3.5 h-11 w-11 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-800 flex items-center justify-center">
                        <span className="text-sm font-medium text-black dark:text-white">
                          A
                        </span>
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 bg-success"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-black dark:text-white truncate">
                          {chatTitle}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {chat.store_domain}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Chat Box */}
          <div className="flex h-full flex-col border-l border-stroke dark:border-strokedark xl:w-3/4 bg-white dark:bg-boxdark">
            {selectedChat?.id ? (
              <>
                <div className="sticky top-0 flex items-center justify-between border-b border-stroke px-6 py-4.5 dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white z-10">
                  <div className="flex items-center">
                    <div className="mr-4.5 h-13 w-13 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-800 flex items-center justify-center">
                      <span className="text-lg font-medium text-black dark:text-white">A</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-black dark:text-white">{t('assistant')}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedChat.isNew ? t('new_chat') : chatDetail?.store_domain || ''}
                      </p>
                    </div>
                  </div>
                  <div>
                    <DropdownDefault />
                  </div>
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-auto px-6 py-7.5 space-y-3.5">
                    {loadingDetail && !selectedChat.isNew && (
                      <div className="flex justify-center py-8">
                        <span className="text-gray-500 dark:text-gray-400">Loading conversation...</span>
                      </div>
                    )}
                    {selectedChat.isNew ? (
                      <>
                        {/* Mensaje de bienvenida del assistant */}
                        <div className="flex justify-start">
                          <div className="max-w-xs">
                            <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                              {t('assistant')}
                            </p>
                            <div className="rounded-2xl border border-blue-300 bg-white dark:bg-boxdark text-black dark:text-white py-3 px-4">
                              <p className="text-sm break-words">
                                {localMessages.length > 0 && localMessages[0].role === 'assistant'
                                  ? renderMessageContent(localMessages[0].content, 'assistant')
                                  : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                        {/* Mensajes locales del usuario */}
                        {localMessages.filter(m => m.role === 'user').map(msg => (
                          <div className="flex justify-end" key={msg.id}>
                            <div className="max-w-xs">
                              <div className="rounded-2xl border border-blue-700 bg-blue-600 text-white py-3 px-4">
                                <p className="text-sm break-words">{msg.content}</p>
                              </div>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {/* Animación de typing del assistant */}
                        {assistantTyping && (
                          <div className="flex justify-start">
                            <div className="max-w-xs">
                              <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">{t('assistant')}</p>
                              <div className="rounded-2xl rounded-tl-none bg-gray-2 dark:bg-boxdark-2 text-black dark:text-white py-3 px-4 flex items-center">
                                <span className="chat-typing-dots">
                                  <span className="chat-typing-dot"></span>
                                  <span className="chat-typing-dot"></span>
                                  <span className="chat-typing-dot"></span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        <style>{typingDotsStyle}</style>
                      </>
                    ) : (() => {
                      // Mensajes locales + mensajes reales
                      const allMessages = [...chatDetail?.conversation_message ?? [], ...localMessages];
                       if (!allMessages.length) return null;
                       // Filtrar mensajes del assistant con 'No answer found'
                       const filteredMessages = allMessages.map(msg => {
                         if (msg.role === 'assistant' && msg.content && msg.content.trim().toLowerCase() === 'no answer found') {
                           return {
                           ...msg,
                           content: "Thank you for your rating and feedback! Your input helps us improve our service."
                           };
                         }
                         return msg;
                       });
                       let lastDate = '';
                       return <>
                         {filteredMessages.map((msg) => {
                           const msgDate = formatDate(msg.createdAt);
                           const showDate = msgDate !== lastDate;
                           lastDate = msgDate;
                           
                           // Detectar automáticamente si el mensaje tiene tabla/acordeón
                           let hasTable = false;
                           if (msg.role === 'assistant') {
                             // 1. Si viene el flag table
                             if (msg.table === true) {
                               hasTable = true;
                             } else if (typeof msg.content === 'string') {
                               // 2. Si incluye el separador antiguo
                               if (msg.content.includes('--------')) {
                                 hasTable = true;
                               } else {
                                 // 3. Si el string parece un array de objetos o un JSON de partes
                                 const trimmed = msg.content.trim();
                                 // Si empieza con [ y termina con ] y contiene {, probablemente es un array de objetos
                                 if (/^\[.*\{.*\}.*\]$/.test(trimmed)) {
                                   hasTable = true;
                                 } else {
                                   // Si empieza con { y contiene campos típicos de partes
                                   if (/^\{.*(partNumber|related_parts|general_info|MFRID|PARTNUMBER).*\}$/.test(trimmed)) {
                                     hasTable = true;
                                   }
                                 }
                               }
                             }
                           }
                           // Parsear el content si tiene tabla
                           const { text, tableData } = hasTable
                             ? parseMessageContent(msg.content, true)
                             : { text: msg.content, tableData: null };
                           
                           return (
                             <React.Fragment key={msg.id}>
                               {showDate && (
                                 <div className="flex justify-center my-4">
                                   <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-boxdark-2 text-xs text-gray-600 dark:text-gray-400 border border-gray-200">
                                     {msgDate}
                                   </span>
                                 </div>
                               )}
                               <div className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                                 <div className={msg.role === 'user' ? 'max-w-md' : 'max-w-4xl'}>
                                   {msg.role !== 'user' && (
                                     <p className="mb-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                                       {t('assistant')}
                                     </p>
                                   )}
                                   <div className={`rounded-2xl py-3 px-4 border shadow-md ${
                                     msg.role === 'user'
                                       ? 'border-blue-700 bg-blue-600 text-white'
                                       : 'border-blue-300 bg-white text-blue-900 dark:bg-boxdark-2 dark:text-white'
                                   }`}
                                   >
                                     <p className="text-sm break-words">
                                       {renderMessageContent(text, msg.role)}
                                     </p>
                                     {/* Mostrar acordeón si tableData es array, si no usar tabla legacy */}
                                     {msg.role === 'assistant' && tableData && Array.isArray(tableData) ? (
                                       <PartsAccordion data={tableData} messageId={msg.id} />
                                     ) : msg.role === 'assistant' && tableData ? (
                                       <TableCollapsible
                                         tableData={tableData}
                                         messageId={msg.id}
                                         isExpanded={expandedTableId === msg.id}
                                         onToggle={() => setExpandedTableId(expandedTableId === msg.id ? null : msg.id)}
                                       />
                                     ) : null}
                                   </div>
                                   <p className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                     {new Date(msg.createdAt).toLocaleTimeString()}
                                   </p>
                                 </div>
                               </div>
                             </React.Fragment>
                           ); 
                         })}
                        {/* Efecto de typing del assistant */}
                        {assistantTyping && (
                          <div className="flex justify-start">
                            <div className="max-w-xs">
                              <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">{t('assistant')}</p>
                              <div className="rounded-2xl rounded-tl-none bg-gray-2 dark:bg-boxdark-2 text-black dark:text-white py-3 px-4 flex items-center">
                                <span className="chat-typing-dots">
                                  <span className="chat-typing-dot"></span>
                                  <span className="chat-typing-dot"></span>
                                  <span className="chat-typing-dot"></span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Animación de los puntos de typing (CSS inyectado) */}
                        <style>{typingDotsStyle}</style>
                      </>;
                    })()}
                    {/* Show rating bubble if needed */}
                     {showRatingBubble && (
                       <div className="flex justify-start">
                         <div className="max-w-xs">
                           <div className="rounded-2xl border border-blue-300 bg-white dark:bg-boxdark text-black dark:text-white py-3 px-4">
                             <RatingBubble
                               onSubmit={handleRatingSubmit}
                               loading={ratingLoading}
                               error={ratingError}
                             />
                           </div>
                         </div>
                       </div>
                     )}
                    <div ref={messagesEndRef} />
                  </div>
                  {/* Input fijo abajo */}
                  <div className="border-t border-stroke bg-white py-5 px-6 dark:border-strokedark dark:bg-boxdark sticky bottom-0 z-10">
                     <form className="flex items-center justify-between space-x-4" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                       <div className="relative flex-1">
                         <input
                           type="text"
                           value={inputValue}
                           onChange={e => setInputValue(e.target.value)}
                           placeholder={t('type_message')}
                           className="h-12 w-full rounded-md border border-stroke bg-gray-2 dark:bg-boxdark-2 pl-5 pr-12 text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-primary"
                           onKeyDown={handleTyping}
                         />
                       </div>
                       <button className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-primary text-white hover:bg-opacity-90 transition-all">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                           <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                           <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                         </svg>
                       </button>
                     </form>
                     <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-left">
                       {t('disclaimer')}
                     </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
    </DefaultLayout>
  );
};

export default MessagesMe;