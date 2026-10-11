// Utility to detect commercial corporate chain brands and provide tailored styling

const CHAIN_BRANDS_LOWER = [
    'starbucks',
    'mccafe',
    'mccafé',
    'mcdonald',
    'mcdonalds',
    'mcdonald\'s',
    'kfc',
    'kentucky fried chicken',
    'burger king',
    'subway',
    '7-eleven',
    'seven eleven',
    'circle k',
    'pacific coffee',
    'costa coffee',
    'tim hortons',
    'pizza hut',
    'domino',
    'domino\'s',
    'dunkin',
    'dunkin\' donuts',
    'wendy',
    'wendy\'s',
    'popeyes',
    'taco bell',
    'five guys',
    'shake shack',
    'haagen-dazs',
    'häagen-dazs',
    'baskin-robbins',
    'luckin',
    'luckin coffee',
    'mixue',
    'chagee',
    'heytea',
    'gong cha',
    'koi the',
    'yoshinoya',
    'sukiya',
    'matsuya',
    'fairwood',
    'cafe de coral',
    'maxim',
    'maxims',
    'maxim\'s',
    'genki sushi',
    'sushiro',
    'itacho sushi',
];

const CHAIN_BRANDS_ZH = [
    '星巴克',
    '麦当劳',
    '麥當勞',
    '肯德基',
    '汉堡王',
    '漢堡王',
    '赛百味',
    '賽百味',
    '七十一',
    '太平洋咖啡',
    '吉野家',
    '大家樂',
    '大快活',
    '美心',
    '元氣壽司',
    '壽司郎',
    '爭鮮',
    '必勝客',
    '達美樂',
    '蜜雪冰城',
    '霸王茶姬',
    '喜茶',
    '貢茶',
    '瑞幸',
    'すき家',
    '松屋',
];

export function isCommercialChain(name: string): boolean {
    if (!name) return false;
    const lower = name.toLowerCase();

    for (const pattern of CHAIN_BRANDS_LOWER) {
        if (lower.includes(pattern)) return true;
    }

    for (const zh of CHAIN_BRANDS_ZH) {
        if (name.includes(zh)) return true;
    }

    return false;
}

