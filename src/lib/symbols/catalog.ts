import type { SearchResult } from "@/lib/market-data/types";

export interface NseInstrument {
  symbol: string;
  name: string;
  aliases: string[];
}

export const WATCHLIST_SYMBOLS = [
  "HDFCBANK",
  "KAYNES",
  "RELIANCE",
  "ICICIBANK",
  "INFY",
  "TCS",
  "SBIN",
  "LT",
  "BHARTIARTL",
  "AXISBANK",
] as const;

export const NSE_CATALOG: NseInstrument[] = [
  { symbol: "HDFCBANK", name: "HDFC Bank", aliases: ["HDFC", "HDFC BANK", "HDFCB"] },
  { symbol: "KAYNES", name: "Kaynes Technology", aliases: ["KAYNES TECHNOLOGY", "KAYNESTECH"] },
  { symbol: "RELIANCE", name: "Reliance Industries", aliases: ["RIL", "RELIANCE INDUSTRIES"] },
  { symbol: "ICICIBANK", name: "ICICI Bank", aliases: ["ICICI", "ICICI BANK"] },
  { symbol: "INFY", name: "Infosys", aliases: ["INFOSYS", "INFOSYS LTD"] },
  { symbol: "TCS", name: "Tata Consultancy Services", aliases: ["TATA CONSULTANCY", "TATA CONSULTANCY SERVICES"] },
  { symbol: "SBIN", name: "State Bank of India", aliases: ["SBI", "STATE BANK", "STATE BANK OF INDIA"] },
  { symbol: "LT", name: "Larsen & Toubro", aliases: ["L&T", "LARSEN", "LARSEN AND TOUBRO", "LARSEN & TOUBRO"] },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", aliases: ["AIRTEL", "BHARTI", "BHARTI AIRTEL"] },
  { symbol: "AXISBANK", name: "Axis Bank", aliases: ["AXIS", "AXIS BANK"] },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", aliases: ["KOTAK"] },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", aliases: ["BAJAJ FINANCE"] },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv", aliases: ["BAJAJ FINSERV"] },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance", aliases: ["HDFC LIFE"] },
  { symbol: "SBILIFE", name: "SBI Life Insurance", aliases: ["SBI LIFE"] },
  { symbol: "ITC", name: "ITC", aliases: ["ITC LTD"] },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", aliases: ["HUL", "HINDUSTAN UNILEVER"] },
  { symbol: "ASIANPAINT", name: "Asian Paints", aliases: ["ASIAN PAINTS"] },
  { symbol: "MARUTI", name: "Maruti Suzuki", aliases: ["MARUTI SUZUKI"] },
  { symbol: "M&M", name: "Mahindra & Mahindra", aliases: ["MAHINDRA", "M AND M"] },
  { symbol: "TATAMOTORS", name: "Tata Motors", aliases: ["TATA MOTORS"] },
  { symbol: "TATASTEEL", name: "Tata Steel", aliases: ["TATA STEEL"] },
  { symbol: "TITAN", name: "Titan Company", aliases: ["TITAN"] },
  { symbol: "NESTLEIND", name: "Nestle India", aliases: ["NESTLE"] },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", aliases: ["ULTRATECH"] },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", aliases: ["SUN PHARMA"] },
  { symbol: "CIPLA", name: "Cipla", aliases: ["CIPLA"] },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories", aliases: ["DR REDDY", "DRREDDYS"] },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals", aliases: ["APOLLO"] },
  { symbol: "HCLTECH", name: "HCL Technologies", aliases: ["HCL", "HCL TECH"] },
  { symbol: "WIPRO", name: "Wipro", aliases: ["WIPRO"] },
  { symbol: "TECHM", name: "Tech Mahindra", aliases: ["TECH MAHINDRA"] },
  { symbol: "ONGC", name: "Oil and Natural Gas Corporation", aliases: ["ONGC"] },
  { symbol: "NTPC", name: "NTPC", aliases: ["NTPC"] },
  { symbol: "POWERGRID", name: "Power Grid Corporation", aliases: ["POWER GRID"] },
  { symbol: "COALINDIA", name: "Coal India", aliases: ["COAL INDIA"] },
  { symbol: "BPCL", name: "Bharat Petroleum", aliases: ["BPCL"] },
  { symbol: "IOC", name: "Indian Oil Corporation", aliases: ["IOC", "IOCL", "INDIAN OIL", "INDIAN OIL CORPORATION"] },
  { symbol: "HINDPETRO", name: "Hindustan Petroleum", aliases: ["HPCL", "HPC", "HINDUSTAN PETROLEUM"] },
  { symbol: "JSWSTEEL", name: "JSW Steel", aliases: ["JSW"] },
  { symbol: "HINDALCO", name: "Hindalco Industries", aliases: ["HINDALCO"] },
  { symbol: "ADANIENT", name: "Adani Enterprises", aliases: ["ADANI"] },
  { symbol: "ADANIPORTS", name: "Adani Ports", aliases: ["ADANI PORTS"] },
  { symbol: "BEL", name: "Bharat Electronics", aliases: ["BEL"] },
  { symbol: "HAL", name: "Hindustan Aeronautics", aliases: ["HAL"] },
  { symbol: "DIXON", name: "Dixon Technologies", aliases: ["DIXON"] },
  { symbol: "POLYCAB", name: "Polycab India", aliases: ["POLYCAB"] },
  { symbol: "PERSISTENT", name: "Persistent Systems", aliases: ["PERSISTENT"] },
  { symbol: "COFORGE", name: "Coforge", aliases: ["COFORGE"] },
  { symbol: "LTIM", name: "LTIMindtree", aliases: ["LTIMINDTREE", "LTI"] },
  { symbol: "TRENT", name: "Trent", aliases: ["TRENT", "ZUDIO", "WESTSIDE"] },
  { symbol: "DMART", name: "Avenue Supermarts", aliases: ["DMART", "D MART"] },
  { symbol: "ZOMATO", name: "Eternal", aliases: ["ZOMATO", "ETERNAL"] },
  { symbol: "PAYTM", name: "One 97 Communications", aliases: ["PAYTM"] },
  { symbol: "NYKAA", name: "FSN E-Commerce Ventures", aliases: ["NYKAA"] },
  { symbol: "IRCTC", name: "IRCTC", aliases: ["IRCTC"] },
  { symbol: "INDIGO", name: "InterGlobe Aviation", aliases: ["INDIGO", "GOAIR", "INTERGLOBE"] },
  { symbol: "PIDILITIND", name: "Pidilite Industries", aliases: ["PIDILITE"] },
  { symbol: "DABUR", name: "Dabur India", aliases: ["DABUR"] },
  { symbol: "GODREJCP", name: "Godrej Consumer Products", aliases: ["GODREJ"] },
  { symbol: "BRITANNIA", name: "Britannia Industries", aliases: ["BRITANNIA"] },
  { symbol: "HAVELLS", name: "Havells India", aliases: ["HAVELLS"] },
  { symbol: "VOLTAS", name: "Voltas", aliases: ["VOLTAS"] },
  { symbol: "SIEMENS", name: "Siemens", aliases: ["SIEMENS"] },
  { symbol: "ABB", name: "ABB India", aliases: ["ABB"] },
  { symbol: "CUMMINSIND", name: "Cummins India", aliases: ["CUMMINS"] },
  { symbol: "BHEL", name: "Bharat Heavy Electricals", aliases: ["BHEL"] },
  { symbol: "PFC", name: "Power Finance Corporation", aliases: ["PFC"] },
  { symbol: "RECLTD", name: "REC Limited", aliases: ["REC"] },
  { symbol: "BANKBARODA", name: "Bank of Baroda", aliases: ["BOB", "BANK OF BARODA"] },
  { symbol: "PNB", name: "Punjab National Bank", aliases: ["PNB"] },
  { symbol: "CANBK", name: "Canara Bank", aliases: ["CANARA"] },
  { symbol: "INDUSINDBK", name: "IndusInd Bank", aliases: ["INDUSIND"] },
  { symbol: "FEDERALBNK", name: "Federal Bank", aliases: ["FEDERAL BANK"] },
  { symbol: "IDFCFIRSTB", name: "IDFC First Bank", aliases: ["IDFC"] },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto", aliases: ["BAJAJ AUTO"] },
  { symbol: "EICHERMOT", name: "Eicher Motors", aliases: ["EICHER", "ROYAL ENFIELD"] },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp", aliases: ["HERO"] },
  { symbol: "TVSMOTOR", name: "TVS Motor Company", aliases: ["TVS"] },
  { symbol: "GRASIM", name: "Grasim Industries", aliases: ["GRASIM"] },
  { symbol: "SHREECEM", name: "Shree Cement", aliases: ["SHREE CEMENT"] },
  { symbol: "AMBUJACEM", name: "Ambuja Cements", aliases: ["AMBUJA"] },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", aliases: ["DIVIS"] },
  { symbol: "LUPIN", name: "Lupin", aliases: ["LUPIN"] },
  { symbol: "AUROPHARMA", name: "Aurobindo Pharma", aliases: ["AUROBINDO"] },
  { symbol: "MAXHEALTH", name: "Max Healthcare", aliases: ["MAX HEALTH"] },
  { symbol: "NAUKRI", name: "Info Edge", aliases: ["INFO EDGE", "INFOEDGE"] },
  { symbol: "POLICYBZR", name: "PB Fintech", aliases: ["POLICYBAZAAR", "PB FINTECH"] },
  { symbol: "SBICARD", name: "SBI Cards", aliases: ["SBI CARD"] },
  { symbol: "CHOLAFIN", name: "Cholamandalam Investment", aliases: ["CHOLA"] },
  { symbol: "MUTHOOTFIN", name: "Muthoot Finance", aliases: ["MUTHOOT"] },
  { symbol: "LICI", name: "Life Insurance Corporation of India", aliases: ["LIC"] },
  { symbol: "IRFC", name: "Indian Railway Finance Corporation", aliases: ["IRFC"] },
  { symbol: "NHPC", name: "NHPC", aliases: ["NHPC"] },
  { symbol: "GAIL", name: "GAIL India", aliases: ["GAIL"] },
  { symbol: "VEDL", name: "Vedanta", aliases: ["VEDANTA"] },
  { symbol: "HINDZINC", name: "Hindustan Zinc", aliases: ["HINDUSTAN ZINC"] },
  { symbol: "JIOFIN", name: "Jio Financial Services", aliases: ["JIO FIN", "JIOFINANCIAL"] },
  { symbol: "ADANIGREEN", name: "Adani Green Energy", aliases: ["ADANI GREEN"] },
  { symbol: "ADANIPOWER", name: "Adani Power", aliases: ["ADANI POWER"] },
  { symbol: "TATAPOWER", name: "Tata Power", aliases: ["TATA POWER"] },
  { symbol: "TATACONSUM", name: "Tata Consumer Products", aliases: ["TATA CONSUMER"] },
  { symbol: "VBL", name: "Varun Beverages", aliases: ["VARUN"] },
  { symbol: "UNITDSPR", name: "United Spirits", aliases: ["UNITED SPIRITS", "DIAEGO", "MCDOWELL"] },
  { symbol: "SOLARINDS", name: "Solar Industries", aliases: ["SOLAR"] },
  { symbol: "SUZLON", name: "Suzlon Energy", aliases: ["SUZLON"] },
  { symbol: "BSE", name: "BSE Limited", aliases: ["BSE"] },
  { symbol: "MCX", name: "Multi Commodity Exchange", aliases: ["MCX"] },
  { symbol: "CDSL", name: "Central Depository Services", aliases: ["CDSL"] },
  { symbol: "CAMS", name: "Computer Age Management Services", aliases: ["CAMS"] },
  { symbol: "ANGELONE", name: "Angel One", aliases: ["ANGEL"] },
  { symbol: "KPITTECH", name: "KPIT Technologies", aliases: ["KPIT"] },
  { symbol: "TATAELXSI", name: "Tata Elxsi", aliases: ["TATA ELXSI"] },
  { symbol: "OFSS", name: "Oracle Financial Services", aliases: ["OFSS", "ORACLE FINANCIAL"] },
  { symbol: "MPHASIS", name: "Mphasis", aliases: ["MPHASIS"] },
  { symbol: "LTTS", name: "L&T Technology Services", aliases: ["LTTS"] },
  {
    symbol: "SETFNIF50",
    name: "SBI Nifty 50 ETF",
    aliases: ["SBI ETF", "SBI NIFTY ETF", "SBI NIFTY 50 ETF", "SETFNIFTY", "SBI NIFTY50 ETF"],
  },
  {
    symbol: "SETFNIFBK",
    name: "SBI Nifty Bank ETF",
    aliases: ["SBI BANK ETF", "SBI NIFTY BANK ETF"],
  },
  { symbol: "NIFTYBEES", name: "Nippon India Nifty 50 BeES", aliases: ["NIFTY BEES", "NIFTYBEES"] },
  { symbol: "GOLDBEES", name: "Nippon India Gold BeES", aliases: ["GOLD BEES", "GOLDBEES"] },
  { symbol: "BANKBEES", name: "Nippon India Bank BeES", aliases: ["BANK BEES", "BANKBEES"] },
];

const SYMBOL_INDEX = new Map<string, NseInstrument>();

function normalize(value: string): string {
  return value
    .toUpperCase()
    .replace(/[.]NS$/i, "")
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\b(LTD|LIMITED|INDIA|THE)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string): string {
  return normalize(value).replace(/\s+/g, "");
}

for (const instrument of NSE_CATALOG) {
  SYMBOL_INDEX.set(compact(instrument.symbol), instrument);
  SYMBOL_INDEX.set(compact(instrument.name), instrument);
  for (const alias of instrument.aliases) {
    SYMBOL_INDEX.set(compact(alias), instrument);
  }
}

export function getInstrument(symbol: string): NseInstrument | undefined {
  return SYMBOL_INDEX.get(compact(symbol));
}

export function isKnownNseSymbol(symbol: string): boolean {
  const compactSymbol = compact(symbol);
  return NSE_CATALOG.some((item) => compact(item.symbol) === compactSymbol);
}

export function resolveNseSymbol(input: string): NseInstrument | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  return SYMBOL_INDEX.get(compact(trimmed));
}

export function searchCatalog(query: string, limit = 8): SearchResult[] {
  const normalized = normalize(query);
  const compactQuery = compact(query);
  if (!normalized) return [];

  const scored = NSE_CATALOG.map((instrument) => {
    const haystacks = [instrument.symbol, instrument.name, ...instrument.aliases].map(normalize);
    const compactHaystacks = haystacks.map((value) => value.replace(/\s+/g, ""));
    let score = 0;
    if (compact(instrument.symbol) === compactQuery) score = 100;
    else if (compactHaystacks.some((value) => value === compactQuery)) score = 90;
    else if (compact(instrument.symbol).startsWith(compactQuery)) score = 80;
    else if (compactHaystacks.some((value) => value.startsWith(compactQuery))) score = 70;
    else if (haystacks.some((value) => value.includes(normalized))) score = 50;
    else if (compactHaystacks.some((value) => value.includes(compactQuery))) score = 40;
    return { instrument, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.instrument.name.localeCompare(b.instrument.name));

  const unique = new Map<string, SearchResult>();
  for (const item of scored) {
    if (unique.size >= limit) break;
    unique.set(item.instrument.symbol, {
      symbol: item.instrument.symbol,
      name: item.instrument.name,
      exchange: "NSE",
    });
  }
  return [...unique.values()];
}

export function toYahooSymbol(nseSymbol: string): string {
  return `${nseSymbol}.NS`;
}

export function fromYahooSymbol(yahooSymbol: string): string {
  return yahooSymbol.replace(/\.NS$/i, "").toUpperCase();
}
