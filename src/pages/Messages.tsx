import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DropdownDefault from '../components/Dropdowns/DropdownDefault';
import DefaultLayout from '../layout/DefaultLayout';
import { useConversationsPaginated, useConversationById } from '../hooks/useConversation';
import { getConversationsPaginated } from '../libs/ConversationService';
import { useCustomerById } from '../hooks/useCustomer';

const Messages: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const { t } = useTranslation();
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  // Hooks para todas las conversaciones
  const { data: chats, loading: loadingChats } = useConversationsPaginated({ page, limit });
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
    return () => { ignore = true; clearInterval(interval); };
  }, [page, limit]);
  const { data: chatDetail, loading: loadingDetail } = useConversationById(selectedChat?.id ?? '');

  // Customer del chat seleccionado
  const { data: customerData } = useCustomerById(selectedChat?.customer_id ?? '');
  const customer = selectedChat?.conversation_customer;

  // Ref para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [chatDetail?.conversation_message]);

  // Regex para links tipo Markdown [texto](url)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  // Regex para URLs sueltas
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  function renderMessageContent(content: string, isUser: boolean) {
    // Primero parsea los links tipo Markdown
    let elements: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    while ((match = markdownLinkRegex.exec(content)) !== null) {
      // Texto antes del link
      if (match.index > lastIndex) {
        const before = content.slice(lastIndex, match.index);
        // Parsear URLs sueltas en el texto antes del link Markdown
        elements = elements.concat(parseUrls(before, isUser));
      }
      // El link Markdown
      const text = match[1];
      const url = match[2];
      const isPdf = url.trim().toLowerCase().endsWith('.pdf');
      elements.push(
        <a
          key={elements.length}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={isUser ? "underline break-all" : "text-blue-700 dark:text-blue-300 underline break-all"}
        >
          {text || (isPdf ? 'Download file' : 'Open link')}
        </a>
      );
      lastIndex = markdownLinkRegex.lastIndex;
    }
    // Resto del texto después del último link Markdown
    if (lastIndex < content.length) {
      elements = elements.concat(parseUrls(content.slice(lastIndex), isUser));
    }
    return elements;
  }

  // Helper para parsear URLs sueltas y renderizarlas como links
  function parseUrls(text: string, isUser: boolean) {
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        const isPdf = part.trim().toLowerCase().endsWith('.pdf');
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={isUser ? "underline break-all" : "text-blue-700 dark:text-blue-300 underline break-all"}
          >
            {isPdf ? 'Download file' : 'Open link'}
          </a>
        );
      }
      return part;
    });
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  return (
    <DefaultLayout>
  <Breadcrumb pageName={t('all_messages')} />
      <div className="h-[calc(100vh-186px)] overflow-hidden sm:h-[calc(100vh-174px)]">
        <div className="h-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark xl:flex">
          {/* Chat List */}
          <div className="hidden h-full flex-col xl:flex xl:w-1/4 bg-white dark:bg-boxdark border-r-2 border-blue-300">
            {/* Header */}
            <div className="border-b border-stroke dark:border-strokedark px-6 py-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-black dark:text-white whitespace-nowrap">
                  {t('all_messages')} <span className="text-xs ml-1">{chats?.totalItems ?? 0}</span>
                </h4>
                {/* You can add a new chat button here if you want */}
              </div>
            </div>

            {/* Chats per page selector */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-stroke dark:border-strokedark">
              <label htmlFor="limit" className="text-sm font-medium text-black dark:text-white">
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
            <div className="px-6 py-3 border-b border-stroke dark:border-strokedark">
              <form className="relative">
                <input
                  type="text"
                  className="w-full rounded border border-stroke bg-gray-2 dark:bg-boxdark-2 py-2.5 pl-5 pr-10 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                  placeholder={t('search')}
                  disabled={loadingChats}
                />
                <button type="button" className="absolute top-1/2 right-4 -translate-y-1/2">
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
                {(pollChats?.items || chats?.items || []).map((chat) => {
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
                          {chat.store_domain?.charAt(0)?.toUpperCase()}
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
            <div className="flex h-full flex-col border-l border-stroke dark:border-strokedark xl:w-3/4">
            {selectedChat?.id && chatDetail ? (
              <>
                <div className="sticky top-0 flex items-center justify-between border-b border-stroke px-6 py-4.5 dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white z-10">
                  <div className="flex items-center">
                    <div className="mr-4.5 h-13 w-13 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-800 flex items-center justify-center">
                      <span className="text-lg font-medium text-black dark:text-white">
                        {customerData?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h5 className="font-medium text-black dark:text-white">
                        {customerData?.name || t('user_no_name')}
                      </h5>
                      <p className="text-sm text-gray-200 dark:text-gray-300">{chatDetail?.store_domain || ''}</p>
                    </div>
                  </div>
                  <div>
                    <DropdownDefault />
                  </div>
                </div>

                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-auto px-6 py-7.5 space-y-3.5">
                    {loadingDetail && (
                      <div className="flex justify-center py-8">
                        <span className="text-gray-500 dark:text-gray-400">Loading conversation...</span>
                      </div>
                    )}
                    {(() => {
                      if (!chatDetail?.conversation_message?.length) return null;
                      let lastDate = '';
                      return chatDetail.conversation_message.map((msg) => {
                        // Custom message for 'No answer found'
                        let content = msg.content;
                        if (msg.role === 'assistant' && content && content.trim().toLowerCase() === 'no answer found') {
                          content = "Thank you for your rating and feedback! Your input helps us improve our service.";
                        }
                        const msgDate = formatDate(msg.createdAt);
                        const showDate = msgDate !== lastDate;
                        lastDate = msgDate;
                        return (
                          <React.Fragment key={msg.id}>
                            {showDate && (
                              <div className="flex justify-center my-4">
                                <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-boxdark-2 text-xs text-gray-600 dark:text-gray-400 border border-gray-200">
                                  {msgDate}
                                </span>
                              </div>
                            )}
                            <div className={msg.role === 'user' ? 'flex justify-start' : 'flex justify-end'}>
                              <div className={msg.role === 'user' ? 'max-w-xs' : 'max-w-xs'}>
                                {msg.role === 'user' && (
                                  <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {customer?.name || t('user')}
                                  </p>
                                )}
                                {msg.role === 'assistant' && (
                                  <p className="mb-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                                    {t('assistant')}
                                  </p>
                                )}
                                <div className={`rounded-2xl py-3 px-4 border shadow-md ${
                                  msg.role === 'user'
                                    ? 'border-blue-700 bg-blue-600 text-white'
                                    : 'border-blue-300 bg-gray-100 text-blue-900 dark:bg-gray-700 dark:text-white'
                                }`}>
                                  <p className="text-sm break-words">
                                    {renderMessageContent(content, msg.role === 'user')}
                                  </p>
                                </div>
                                <p className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${msg.role === 'user' ? 'text-left' : 'text-right'}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      });
                    })()}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input fijo abajo (deshabilitado) */}
                  <div className="border-t border-stroke bg-white py-5 px-6 dark:border-strokedark dark:bg-boxdark sticky bottom-0 z-10">
                    <form className="flex items-center justify-between space-x-4">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder={t('type_message')}
                          className="h-12 w-full rounded-md border border-stroke bg-gray-2 dark:bg-boxdark-2 pl-5 pr-12 text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-primary cursor-not-allowed"
                          disabled
                        />
                      </div>
                      <button className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-gray-300 text-white transition-all cursor-not-allowed" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </form>
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

export default Messages;