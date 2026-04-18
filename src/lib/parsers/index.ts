import type { PageContent, ParseResult } from '../pdf/types';
import { detectBankFromText } from '../pdf/detectBank';
import { parseMashreq } from './mashreq';
import { parseEnbd } from './enbd';
import { parseEmiratesIslamic } from './emiratesislamic';
import { parseRakbank } from './rakbank';
import { parseCbd } from './cbd';
import { parseGeneric } from './generic';
import { parseWithConfig, type ParserConfigData } from './configParser';

export type { ParserConfigData };

type Parser = (pages: PageContent[]) => ParseResult;

export const BUILTIN_PARSERS: Record<string, Parser> = {
  mashreq: parseMashreq,
  enbd: parseEnbd,
  emiratesislamic: parseEmiratesIslamic,
  rakbank: parseRakbank,
  cbd: parseCbd,
};

export type ParseResultWithMeta = ParseResult & { parsedBy: 'builtin' | 'config' | 'generic' };

/**
 * Detect the bank and dispatch to the correct parser.
 * Pass `dbConfig` when a user-created config matches — checked by the API route.
 */
export function parseStatement(
  pages: PageContent[],
  bankOverride?: string,
  dbConfig?: ParserConfigData | null,
): ParseResultWithMeta {
  const allLines = pages.flatMap(p => p.lines);
  const bank = bankOverride ?? detectBankFromText(allLines);

  if (BUILTIN_PARSERS[bank]) {
    return { ...BUILTIN_PARSERS[bank](pages), parsedBy: 'builtin' };
  }
  if (dbConfig) {
    return { ...parseWithConfig(pages, dbConfig), parsedBy: 'config' };
  }
  return { ...parseGeneric(pages), parsedBy: 'generic' };
}
