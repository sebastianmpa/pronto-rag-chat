import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DropdownDefault from '../components/Dropdowns/DropdownDefault';
import DefaultLayout from '../layout/DefaultLayout';
import { useConversationsPaginated, useConversationById } from '../hooks/useConversation';
import { getConversationsPaginated } from '../libs/ConversationService';
import { useCustomerById } from '../hooks/useCustomer';
import { format } from 'date-fns';

// Helper para extraer texto y tabla del content
const parseMessageContent = (content: string, hasTable: boolean) => {
  if (!hasTable) {
    return { text: content, tableData: null };
  }

  try {
    let textContent = content;
    let tableData = null;

    // Paso 0: Buscar y extraer JSON embebido al final con patrón ._____{'partInfo':...}
    let jsonMatch = content.match(/\._____(\{[\s\S]*\})$/);
    
    // Si no encuentra con ._____,  buscar _____ sin punto
    if (!jsonMatch) {
      jsonMatch = content.match(/_____(\{[\s\S]*\})$/);
    }
    
    // Si no encuentra con _____, buscar {'partInfo' en el content
    if (!jsonMatch) {
      const jsonStartIdx = content.indexOf("{'partInfo'");
      if (jsonStartIdx !== -1) {
        // Encontrar el final del JSON (último })
        let braceCount = 0;
        let inString = false;
        let stringChar = '';
        let jsonEndIdx = -1;
        
        for (let i = jsonStartIdx; i < content.length; i++) {
          const char = content[i];
          const prevChar = i > 0 ? content[i - 1] : '';
          
          if ((char === '"' || char === "'") && prevChar !== '\\') {
            if (!inString) {
              inString = true;
              stringChar = char;
            } else if (char === stringChar) {
              inString = false;
            }
          }
          
          if (!inString) {
            if (char === '{' || char === '[') braceCount++;
            else if (char === '}' || char === ']') braceCount--;
            
            if (braceCount === 0 && i > jsonStartIdx) {
              jsonEndIdx = i;
              break;
            }
          }
        }
        
        if (jsonEndIdx !== -1) {
          jsonMatch = [content.substring(jsonStartIdx, jsonEndIdx + 1), content.substring(jsonStartIdx, jsonEndIdx + 1)];
        }
      }
    }
    
    if (jsonMatch && jsonMatch[1]) {
      let jsonStr = jsonMatch[1]; // Extrae del content ORIGINAL (puede tener None, True, False)
      textContent = content.substring(0, content.lastIndexOf(jsonStr)); // Remover el JSON del content ORIGINAL
      textContent = textContent.replace(/_____$/, '').trim(); // Remover separador si existe
      
      console.log('[parseMessageContent] Found JSON embebido, attempting to parse. Length:', jsonStr.length);
      console.log('[parseMessageContent] JSON (first 200 chars):', jsonStr.substring(0, 200));
      
      try {
        // Estrategia INTELIGENTE: reemplazar comillas simples SOLO en delimitadores de keys/values
        let normalized = jsonStr;
        
        // 1. Reemplazar None, True, False DENTRO del JSON
        normalized = normalized.replace(/:\s*None\b/g, ': null');
        normalized = normalized.replace(/:\s*True\b/g, ': true');
        normalized = normalized.replace(/:\s*False\b/g, ': false');
        normalized = normalized.replace(/,\s*None\b/g, ', null');
        normalized = normalized.replace(/,\s*True\b/g, ', true');
        normalized = normalized.replace(/,\s*False\b/g, ', false');
        normalized = normalized.replace(/\[\s*None\s*\]/g, '[null]');
        
        // 2. Reemplazar comillas simples por dobles, pero SOLO las que rodean keys o valores
        // Patrón: 'key': o : 'value', o [' o , '
        normalized = normalized.replace(/'/g, '"');
        
        // 3. Ahora tenemos un problema: las comillas dentro de URLs que eran simples se convirtieron en dobles
        // Ejemplo: "jpg?c=2" debería ser "jpg?c=2" (sin cambio, es válido)
        // Pero si hay: "BEARING, 3/4\" ROLLER" esto está mal
        // Necesitamos escapar comillas dobles que estén dentro de strings
        
        // Estrategia: procesar carácter por carácter para identificar y escapar comillas mal colocadas
        let fixed = '';
        let inString = false;
        
        for (let i = 0; i < normalized.length; i++) {
          const char = normalized[i];
          const prevChar = i > 0 ? normalized[i - 1] : '';
          const nextChar = i < normalized.length - 1 ? normalized[i + 1] : '';
          
          if (char === '"' && prevChar !== '\\') {
            if (!inString) {
              inString = true;
              fixed += char;
            } else {
              if (nextChar === ',' || nextChar === '}' || nextChar === ']' || 
                  nextChar === ':' || i === normalized.length - 1) {
                inString = false;
                fixed += char;
              } else {
                fixed += '\\"';
              }
            }
          } else {
            fixed += char;
          }
        }
        
        normalized = fixed;
        
        console.log('[parseMessageContent] Strategy 1: Normalized JSON (first 300 chars):', normalized.substring(0, 300));
        
        const parsed = JSON.parse(normalized);
        console.log('[parseMessageContent] ✅ Strategy 1 - JSON parsed successfully');
        
        // Si tiene partInfo array, usarlo como tableData
        if (parsed.partInfo && Array.isArray(parsed.partInfo)) {
          tableData = parsed.partInfo;
          console.log('[parseMessageContent] ✅ partInfo array found with', tableData.length, 'items');
          return { text: textContent, tableData };
        }
        
        // Si el parsed en sí es un objeto con propiedades de part, tratarlo como tabla
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Si tiene las propiedades típicas de una parte individual, envolverlo en array
          if (parsed.mfrId || parsed.partNumber || parsed.MFRID || parsed.PARTNUMBER) {
            tableData = [parsed];
            console.log('[parseMessageContent] ✅ Single part object detected, wrapping in array');
            return { text: textContent, tableData };
          }
        }
      } catch (e) {
        console.log('[parseMessageContent] Strategy 1 failed:', e.message);
        
        // Intento final: usar eval con try-catch (más permisivo)
        try {
          console.log('[parseMessageContent] Attempting Strategy 1B (eval)...');
          const evaluated = eval('(' + jsonStr + ')');
          if (evaluated && evaluated.partInfo && Array.isArray(evaluated.partInfo)) {
            tableData = evaluated.partInfo;
            console.log('[parseMessageContent] ✅ Strategy 1B - partInfo array found with', tableData.length, 'items');
            return { text: textContent, tableData };
          }
        } catch (evalError) {
          console.log('[parseMessageContent] Strategy 1B (eval) also failed:', evalError.message);
        }
        
        // Continuar con el parsing tradicional
      }
    }

    // Si no encontramos JSON embebido, intentar parsear todo el content como antes
    let parsed: any = null;
    if (typeof content === 'string') {
      let normalized = content;
      
      // Reemplazar None, True, False
      normalized = normalized.replace(/\bNone\b/g, 'null');
      normalized = normalized.replace(/\bTrue\b/g, 'true');
      normalized = normalized.replace(/\bFalse\b/g, 'false');
      
      console.log('[parseMessageContent] First 100 chars of normalized:', normalized.substring(0, 100));
      
      // Reparar comillas dobles sin escape dentro de valores
      normalized = normalized.replace(/": "([^"]*)"/g, (match, value) => {
        if (value.includes('"')) {
          const escapedValue = value.replace(/"/g, '\\"');
          return `": "${escapedValue}"`;
        }
        return match;
      });
      
      // Buscar patrones rotos como: "14" Chain FITS
      normalized = normalized.replace(/": "([^"]*)"([^,}\]]*)(,|\}|\])/g, (match, start, middle, end) => {
        if (middle && middle.trim()) {
          const escapedStart = start.replace(/"/g, '\\"');
          const escapedMiddle = middle.replace(/"/g, '\\"');
          return `": "${escapedStart}\\\"${escapedMiddle}"${end}`;
        }
        return match;
      });
      
      console.log('[parseMessageContent] Chars 560-590:', normalized.substring(560, 590));
      console.log('[parseMessageContent] Attempting JSON.parse...');
      
      try {
        parsed = JSON.parse(normalized);
        console.log('[parseMessageContent] ✅ JSON parsed successfully (Strategy 2):', Array.isArray(parsed) ? `Array with ${parsed.length} items` : typeof parsed);
      } catch (e) {
        console.log('[parseMessageContent] Strategy 2 failed:', e.message);
        const errorPos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
        console.log('[parseMessageContent] Error at position', errorPos);
        console.log('[parseMessageContent] Context (pos', errorPos - 50, 'to', errorPos + 50, '):', normalized.substring(Math.max(0, errorPos - 50), errorPos + 50));
        
        // Strategy 3: Intentar reparar escapes dobles problemáticos
        try {
          console.log('[parseMessageContent] Strategy 3: Fixing double escapes...');
          let repaired = normalized;
          // Reemplazar \" WORD\" con \" WORD (quitar el último escape)
          repaired = repaired.replace(/\\\\" ([^"]*)\\""/g, '\\" $1"');
          console.log('[parseMessageContent] Attempting JSON.parse after repair...');
          parsed = JSON.parse(repaired);
          console.log('[parseMessageContent] ✅ JSON parsed successfully (Strategy 3 - escape repair):', Array.isArray(parsed) ? `Array with ${parsed.length} items` : typeof parsed);
        } catch (e3) {
          console.log('[parseMessageContent] Strategy 3 failed:', e3.message);
          
          // Strategy 4: Reparación más agresiva
          let aggressiveRepair = normalized.replace(/"(\d+)"\s+(\w)/g, '"$1\\\"$2');
          
          try {
            console.log('[parseMessageContent] Strategy 4: Aggressive repair...');
            parsed = JSON.parse(aggressiveRepair);
            console.log('[parseMessageContent] ✅ JSON parsed successfully (Strategy 4):', Array.isArray(parsed) ? `Array with ${parsed.length} items` : typeof parsed);
          } catch (e4) {
            console.log('[parseMessageContent] Strategy 4 failed:', e4.message);
            
            // Strategy 5: Character-by-character repair
            try {
              console.log('[parseMessageContent] Strategy 5: Character-by-character repair...');
              let sanitized = '';
              let inStr = false;
              let strChar = '';
              let prevC = '';
              
              for (let i = 0; i < normalized.length; i++) {
                const char = normalized[i];
                
                if ((char === '"' || char === "'") && prevC !== '\\') {
                  if (!inStr) {
                    inStr = true;
                    strChar = char;
                    sanitized += '"';
                  } else if (char === strChar) {
                    inStr = false;
                    sanitized += '"';
                  } else {
                    sanitized += '\\' + char;
                  }
                } else {
                  sanitized += char;
                }
                
                prevC = char;
              }
              
              parsed = JSON.parse(sanitized);
              console.log('[parseMessageContent] ✅ JSON parsed successfully (Strategy 5):', Array.isArray(parsed) ? `Array with ${parsed.length} items` : typeof parsed);
            } catch (e5) {
              console.log('[parseMessageContent] ❌ All parsing strategies failed:', e5.message);
              // Si todo falla, retornar null tableData porque el contenido no es JSON válido
              return { text: content, tableData: null };
            }
          }
        }
      }
    } else {
      parsed = content;
    }

    // Si parsed ES un array directo, retorna como tableData inmediatamente
    if (Array.isArray(parsed)) {
      console.log('[parseMessageContent] 🎯 Array detected, returning tableData with', parsed.length, 'items');
      return { text: textContent, tableData: parsed };
    }

    // Si tiene partInfo array (desde JSON embebido que se parseó correctamente)
    if (parsed && parsed.partInfo && Array.isArray(parsed.partInfo)) {
      console.log('[parseMessageContent] 🎯 partInfo array detected, returning tableData with', parsed.partInfo.length, 'items');
      return { text: textContent, tableData: parsed.partInfo };
    }

    // Si tiene answer tipo array
    if (parsed && parsed.answer && Array.isArray(parsed.answer)) {
      return { text: textContent, tableData: parsed.answer };
    }

    // Fallback: solo retornar tableData si parsed es array. Si es objeto o inválido, retornar null
    if (Array.isArray(parsed?.table)) {
      return { text: textContent, tableData: parsed.table };
    }
    
    // Si parsed es un objeto pero no tiene un array válido, retornar null
    return {
      text: content,
      tableData: null
    };
  } catch (e) {
    console.log('[parseMessageContent] Final error:', e.message);
    return { text: content, tableData: null };
  }
};


// PartsAccordion component - nuevo formato de visualización de partes
const PartsAccordion: React.FC<{ data: any[]; messageId: string }> = ({ data }) => {
  const { t } = useTranslation();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | string | null>(null);
  const [copiedRelatedIdx, setCopiedRelatedIdx] = useState<{ itemIdx: number; partIdx: number } | null>(null);
  const [viewingLocation, setViewingLocation] = useState<{ [key: string]: 1 | 4 }>({});
  
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
      
      console.log(`[PartsAccordion] Item ${idx}: mfrId=${mfrId}, partNumber=${partNumber}, location=${location}`);
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
  const handleCopyRelated = (partNumber: string, itemIdx: number, partIdx: number) => {
    if (!partNumber) return;
    navigator.clipboard.writeText(partNumber);
    setCopiedRelatedIdx({ itemIdx, partIdx });
    setTimeout(() => setCopiedRelatedIdx(null), 1200);
  };
  
  return (
    <div className="mt-3 max-w-4xl mx-auto">
      {groupedData.map((group, idx) => {
        console.log(`[PartsAccordion Render] Group ${idx}:`, group);
        
        // Determinar qué ubicación mostrar por defecto (preferir 1, luego 4)
        const defaultLocation = (group.loc1 ? 1 : (group.loc4 ? 4 : 1)) as 1 | 4;
        const currentLocation = viewingLocation[idx] || defaultLocation;
        let item = currentLocation === 1 ? group.loc1 : group.loc4;
        
        // Si la ubicación actual no existe, intentar usar la otra
        if (!item) {
          item = currentLocation === 1 ? group.loc4 : group.loc1;
        }
        
        // Si aún no hay item, no mostrar nada
        if (!item) {
          console.log(`[PartsAccordion Render] Group ${idx} has no item, skipping`);
          return null;
        }
        
        console.log(`[PartsAccordion Render] Group ${idx} rendering with item:`, item);
        
        const general = item.general_info || {};
        const relatedParts = item.related_parts || [];
        const mfrId = general.MFRID || item.mfrId || '-';
        const partNumber = general.PARTNUMBER || item.partNumber || '-';
        const description = general.DESCRIPTION || '-';
        const ubicacion = item.location || '-';
        const superseded = item.superseded || general.SUPERCEDETO || '-';
        const cantidad = item.qty_loc ?? general.QTY_LOC ?? '-';
        const hasAlternateLocation = currentLocation === 1 ? !!group.loc4 : !!group.loc1;
        const alternateLocation = currentLocation === 1 ? 4 : 1;
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
                    <span className="flex items-center gap-1">
                      <span className="truncate">{t('parts_accordion.superseded')}: {superseded && superseded !== '' && superseded !== '-' ? superseded : '-'}</span>
                      {superseded && superseded !== '' && superseded !== '-' && (
                        <button
                          type="button"
                          className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 border border-transparent focus:outline-none flex-shrink-0"
                          title={t('parts_accordion.copy_part_number')}
                          onClick={() => handleCopy(superseded, `superseded-${idx}`)}
                        >
                          <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                            <rect x="3" y="3" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                          </svg>
                        </button>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              {/* Quantity alineado a la derecha en su propia columna */}
              <div className="flex flex-col items-end justify-center mr-2 ml-3">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{t('parts_accordion.quantity')}: {cantidad ?? '-'}</span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {/* View location button - solo mostrar si hay ubicación alternativa */}
                {hasAlternateLocation && (
                  <button
                    type="button"
                    className="px-2 py-1 text-xs rounded bg-orange-100 dark:bg-orange-900 hover:bg-orange-200 dark:hover:bg-orange-800 border border-orange-300 dark:border-orange-700 focus:outline-none transition-colors"
                    title={`Click to view location ${alternateLocation}`}
                    onClick={() => setViewingLocation(prev => ({ ...prev, [idx]: alternateLocation }))}
                  >
                    {t('parts_accordion.view_location')} {alternateLocation}
                  </button>
                )}
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
                            <td className="px-2 py-1 text-gray-900 dark:text-white">
                              <div className="flex items-center gap-1">
                                <span>{part.PARTNUMBER || '-'}</span>
                                {part.PARTNUMBER && (
                                  <button
                                    type="button"
                                    className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 border border-transparent focus:outline-none flex-shrink-0"
                                    title={t('parts_accordion.copy_part_number')}
                                    onClick={() => handleCopyRelated(part.PARTNUMBER, idx, pidx)}
                                  >
                                    <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                                      <rect x="3" y="3" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                                    </svg>
                                  </button>
                                )}
                                {copiedRelatedIdx?.itemIdx === idx && copiedRelatedIdx?.partIdx === pidx && (
                                  <span className="text-xs text-green-600 dark:text-green-400">{t('parts_accordion.copied')}</span>
                                )}
                              </div>
                            </td>
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

// TableCollapsible - formato antiguo para datos de objeto
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

const Messages: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const { t } = useTranslation();
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  // Estado para controlar qué tabla está abierta (por message id)
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);

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
  
  const conversationId = selectedChat?.id ?? '';
  const { data: chatDetail, loading: loadingDetail } = useConversationById(conversationId);

  // Customer del chat seleccionado
  const { data: customerData } = useCustomerById(chatDetail?.customer_id ?? '');

  // Ref para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [chatDetail?.conversation_message]);

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
    if (displayContent.trim().startsWith('{') && displayContent.trim().endsWith('}')) {
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
                className="underline break-all"
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
                  className="underline break-all"
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
        
        return <React.Fragment key={idx}>{parts}<br /></React.Fragment>;
      });
    }
    // Usuario: solo texto plano
    return displayContent;
  };

  return (
    <DefaultLayout>
  <Breadcrumb pageName={t('all_messages')} />
      <div className="h-[calc(100vh-186px)] overflow-hidden sm:h-[calc(100vh-174px)] min-h-0">
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
                  // Inicial del nombre del usuario que creó el chat
                  // Primero intenta conversation_customer.name, si no existe, usa solo la primera letra del customer_id como fallback
                  let userInitial = 'U'; // Default
                  if (chat.conversation_customer && chat.conversation_customer.name) {
                    userInitial = chat.conversation_customer.name.charAt(0).toUpperCase();
                  } else if (chat.customer_id) {
                    // Si no hay conversation_customer, usa la primera letra del customer_id
                    userInitial = chat.customer_id.charAt(0).toUpperCase();
                  }
                  
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
                          {userInitial}
                        </span>
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 bg-success"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-black dark:text-white truncate">
                          {chatTitle}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
            <div className="flex h-full flex-col border-l border-stroke dark:border-strokedark xl:w-3/4">
            {selectedChat?.id && chatDetail ? (
              <>
                <div className="sticky top-0 flex items-center justify-between border-b border-stroke px-6 py-3 dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white z-10">
                  <div className="flex items-center">
                    <div className="mr-3.5 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-800 flex items-center justify-center">
                      <span className="text-lg font-medium text-black dark:text-white">
                        {customerData?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-black dark:text-white">
                        {customerData?.name || t('user_no_name')}
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pronto Mowers</p>
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
                    {chatDetail?.conversation_message && chatDetail.conversation_message.length > 0 && (() => {
                      let lastDate = '';
                      return chatDetail.conversation_message.map((msg) => {
                        // Detectar automáticamente si el mensaje tiene tabla/acordeón
                        let hasTable = false;
                        if (msg.role === 'assistant') {
                          // 1. Si viene el flag table
                          if (msg.table === true) {
                            hasTable = true;
                            console.log('[hasTable detection] Flag msg.table === true');
                          } else if (typeof msg.content === 'string') {
                            const trimmed = msg.content.trim();
                            
                            // 2. Si contiene el patrón _____{'partInfo':...} - PRIORITY: check FIRST
                            if (msg.content.includes('_____') && msg.content.includes('partInfo')) {
                              hasTable = true;
                              console.log('[hasTable detection] ✅ Embedded partInfo pattern detected');
                            }
                            // 3. Si incluye el separador antiguo
                            else if (msg.content.includes('--------')) {
                              hasTable = true;
                              console.log('[hasTable detection] Separator "--------" found');
                            }
                            // 4. Si el string STARTS with [ (pure JSON array) - must start AND end with [ ]
                            else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                              // Additional check: must contain { to be array of objects
                              if (trimmed.includes('{')) {
                                hasTable = true;
                                console.log('[hasTable detection] ✅ Array pattern detected');
                              }
                            }
                            // 5. Si el string STARTS with { (pure JSON object) - must start AND end with { }
                            else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                              // Additional check: must contain typical part fields
                              if (trimmed.includes('partNumber') || trimmed.includes('related_parts') || trimmed.includes('general_info') || trimmed.includes('MFRID') || trimmed.includes('PARTNUMBER')) {
                                hasTable = true;
                                console.log('[hasTable detection] Object pattern detected');
                              }
                            }
                            else {
                              console.log('[hasTable detection] ❌ No pattern match. Content starts with:', trimmed.substring(0, 50));
                            }
                          }
                        }
                        // Parsear el content si tiene tabla
                        const { text, tableData } = hasTable
                          ? parseMessageContent(msg.content, true)
                          : { text: msg.content, tableData: null };
                        
                        // Si hasTable es true y el text está vacío o es solo JSON, no mostrar texto
                        const shouldRenderText = !hasTable || (text && text.trim().length > 0 && !text.trim().startsWith('[') && !text.trim().startsWith('{'));
                        
                        console.log('[Render] hasTable:', hasTable, '| tableData type:', Array.isArray(tableData) ? `Array[${tableData.length}]` : typeof tableData, '| shouldRenderText:', shouldRenderText);
                        
                        // Custom message for 'No answer found'
                        let content = text;
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
                              <div className={msg.role === 'user' ? 'max-w-md' : 'max-w-2xl'}>
                                {msg.role === 'user' && (
                                  <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {customerData?.name || t('user')}
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
                                    : 'border-blue-300 bg-white text-blue-900 dark:bg-boxdark-2 dark:text-white'
                                }`}>
                                  {shouldRenderText && (
                                    <p className="text-sm break-words">
                                      {renderMessageContent(text, msg.role)}
                                    </p>
                                  )}
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
                                <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${msg.role === 'user' ? 'text-left' : 'text-right'}`}>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                    {/* Mostrar conversation_context si existe en el mensaje */}
                                    {msg.role === 'assistant' && msg.conversation_context && (
                                      <div className="text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-1 items-center">
                                        {msg.conversation_context.intent && (
                                          <span><span className="font-semibold text-gray-700 dark:text-gray-300">{t('conversation_context.intent')}:</span> {msg.conversation_context.intent}</span>
                                        )}
                                        {msg.conversation_context.mfr && (
                                          <span><span className="font-semibold text-gray-700 dark:text-gray-300">{t('conversation_context.manufacturer')}:</span> {msg.conversation_context.mfr}</span>
                                        )}
                                        {msg.conversation_context.model && (
                                          <span><span className="font-semibold text-gray-700 dark:text-gray-300">{t('conversation_context.model')}:</span> {msg.conversation_context.model}</span>
                                        )}
                                        {msg.conversation_context.serial && (
                                          <span><span className="font-semibold text-gray-700 dark:text-gray-300">{t('conversation_context.serial')}:</span> {msg.conversation_context.serial}</span>
                                        )}
                                        {msg.conversation_context.part && (
                                          <span><span className="font-semibold text-gray-700 dark:text-gray-300">{t('conversation_context.component')}:</span> {msg.conversation_context.part}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
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