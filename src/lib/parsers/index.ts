import type { PageContent, ParseResult } from '../pdf/types';
import { parseGeneric } from './generic';
import { parseWithConfig, type ParserConfigData } from './configParser';

export type { ParserConfigData };

export type ParseResultWithMeta = ParseResult & { parsedBy: 'config' | 'generic' | 'ai' };

/**
 * Parse a statement using a DB-supplied config, or fall back to generic.
 * All parser configs come from the database — there are no hardcoded parsers.
 */
export function parseStatement(
  pages: PageContent[],
  dbConfig?: ParserConfigData | null,
): ParseResultWithMeta {
  if (dbConfig) {
    return { ...parseWithConfig(pages, dbConfig), parsedBy: 'config' };
  }
  return { ...parseGeneric(pages), parsedBy: 'generic' };
}
