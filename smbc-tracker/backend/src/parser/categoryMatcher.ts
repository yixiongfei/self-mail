// Keyword → category mapping (Japanese category names for display)
// Each entry: [category, keywords[]]
const RULES: [string, string[]][] = [
  ['コンビニ', ['SEVEN-ELEVEN', 'SEVENELEVEN', 'LAWSON', 'FAMILYMART', 'FAMILY MART', 'MINISTOP', 'DAILY YAMAZAKI', 'SEICOMART']],
  ['スーパー', ['AEON', 'IYOKO', 'IYONAKA', 'SEIYU', 'LIFE', 'OLYMPIC', 'MARUETSU', 'PEACOCK', 'TOKYU STORE', 'YAOKO', 'BELC', 'UNIQLOFOOD']],
  ['飲食・レストラン', ['MCDONALDS', 'MCDONALD', 'KFC', 'BURGER KING', 'YOSHINOYA', 'SUKIYA', 'MATSUYA', 'NAKAU', 'GUSTO', 'JOYFULL', 'DENNY', 'SAIZERIYA', 'COCO', 'DOMINO', 'PIZZA', 'RAMEN', 'SUSHI', 'YAKINIKU']],
  ['カフェ', ['STARBUCKS', 'DOUTOR', 'EXCELSIOR', 'TULLY', 'KOMEDA', 'PRONTO', 'CAFE', 'COFFEE']],
  ['交通', ['SUICA', 'PASMO', 'IC CARD', 'ICOCA', 'TOICA', 'JR ', 'KEIO', 'ODAKYU', 'TOKYU', 'SEIBU', 'TOBU', 'METRO', 'SUBWAY', 'BUS', 'TAXI', 'UBER', 'GO TAXI']],
  ['ショッピング', ['AMAZON', 'RAKUTEN', 'YAHOO', 'UNIQLO', 'GU ', 'ZARA', 'H&M', 'MUJI', 'LOFT', 'TOKYU HANDS', 'DONKI', 'DON QUIJOTE']],
  ['エンタメ', ['NETFLIX', 'SPOTIFY', 'APPLE', 'GOOGLE', 'STEAM', 'NINTENDO', 'PLAYSTATION', 'CINEMA', 'MOVIE', 'TOHO', 'AEON CINEMA']],
  ['医療・薬局', ['WELCIA', 'TSURUHA', 'MATSUMOTO', 'SUNDRUG', 'PHARMACY', 'CLINIC', 'HOSPITAL', 'DRUGSTORE']],
  ['公共料金', ['NHK', 'TOKYO GAS', 'TEPCO', 'OSAKA GAS', 'KANDEN', 'WATER', 'NTT', 'SOFTBANK', 'DOCOMO', 'AU ', 'RAKUTEN MOBILE']],
  ['ATM・銀行', ['ATM', 'BANK', 'SMBC', 'POST OFFICE']],
];

export function matchCategory(merchant: string): string {
  const upper = merchant.toUpperCase();
  for (const [category, keywords] of RULES) {
    if (keywords.some((kw) => upper.includes(kw))) {
      return category;
    }
  }
  return '未分類';
}
