import type { PageContent, ParseResult } from '../pdf/types';
import { detectBankFromText } from '../pdf/detectBank';
import { parseMashreq } from './mashreq';
import { parseEnbd } from './enbd';
import { parseEmiratesIslamic } from './emiratesislamic';
import { parseRakbank } from './rakbank';
import { parseCbd } from './cbd';
import { parseGeneric } from './generic';

type Parser = (pages: PageContent[]) => ParseResult;

const PARSERS: Record<string, Parser> = {
  mashreq: parseMashreq,
  enbd: parseEnbd,
  emiratesislamic: parseEmiratesIslamic,
  rakbank: parseRakbank,
  cbd: parseCbd,
};

/**
 * Detect the bank from the extracted pages and dispatch to the correct parser.
 * Pass `bankOverride` (e.g. from a form field) to skip auto-detection.
 */
export function parseStatement(pages: PageContent[], bankOverride?: string): ParseResult {
  const allLines = pages.flatMap(p => p.lines);
  const bank = bankOverride ?? detectBankFromText(allLines);
  const parser: Parser = PARSERS[bank] ?? parseGeneric;
  return parser(pages);
}
