// Keyword → category mapping (Chinese category names)
const RULES: [string, string[]][] = [
  ['便利店',   ['SEVEN-ELEVEN', 'SEVENELEVEN', 'LAWSON', 'FAMILYMART', 'FAMILY MART', 'MINISTOP', 'DAILY YAMAZAKI', 'SEICOMART']],
  ['超市',     ['AEON', 'IYOKO', 'IYONAKA', 'SEIYU', 'LIFE', 'OLYMPIC', 'MARUETSU', 'PEACOCK', 'TOKYU STORE', 'YAOKO', 'BELC']],
  ['餐饮',     ['MCDONALDS', 'MCDONALD', 'KFC', 'BURGER KING', 'YOSHINOYA', 'SUKIYA', 'MATSUYA', 'NAKAU', 'GUSTO', 'JOYFULL', 'DENNY', 'SAIZERIYA', 'COCO', 'DOMINO', 'PIZZA', 'RAMEN', 'SUSHI', 'YAKINIKU']],
  ['咖啡',     ['STARBUCKS', 'DOUTOR', 'EXCELSIOR', 'TULLY', 'KOMEDA', 'PRONTO', 'CAFE', 'COFFEE']],
  ['交通出行', ['SUICA', 'PASMO', 'IC CARD', 'ICOCA', 'TOICA', 'JR ', 'KEIO', 'ODAKYU', 'TOKYU', 'SEIBU', 'TOBU', 'METRO', 'SUBWAY', 'BUS', 'TAXI', 'UBER', 'GO TAXI']],
  ['购物',     ['AMAZON', 'RAKUTEN', 'YAHOO', 'UNIQLO', 'GU ', 'ZARA', 'H&M', 'MUJI', 'LOFT', 'TOKYU HANDS', 'DONKI', 'DON QUIJOTE']],
  ['娱乐',     ['NETFLIX', 'SPOTIFY', 'APPLE', 'GOOGLE', 'STEAM', 'NINTENDO', 'PLAYSTATION', 'CINEMA', 'MOVIE', 'TOHO', 'AEON CINEMA']],
  ['医疗药局', ['WELCIA', 'TSURUHA', 'MATSUMOTO', 'SUNDRUG', 'PHARMACY', 'CLINIC', 'HOSPITAL', 'DRUGSTORE']],
  ['水电通信', ['NHK', 'TOKYO GAS', 'TEPCO', 'OSAKA GAS', 'KANDEN', 'WATER', 'NTT', 'SOFTBANK', 'DOCOMO', 'AU ', 'RAKUTEN MOBILE']],
  ['ATM/银行', ['ATM', 'BANK', 'SMBC', 'POST OFFICE']],
];

export const DEFAULT_CATEGORIES = RULES.map(([name]) => name).concat(['未分类']);

export function matchCategory(merchant: string): string {
  const upper = merchant.toUpperCase();
  for (const [category, keywords] of RULES) {
    if (keywords.some((kw) => upper.includes(kw))) {
      return category;
    }
  }
  return '未分类';
}
