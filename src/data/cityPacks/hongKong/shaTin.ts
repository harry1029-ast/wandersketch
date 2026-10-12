import { CityPack } from '../types';

export const HONG_KONG_SHA_TIN_PACK: CityPack = {
    id: 'sha_tin_district',
    cityName: 'Hong Kong',
    districtName: 'Hong Kong • Sha Tin & Ma On Shan',
    country: 'Hong Kong',
    center: [22.3898, 114.2002],
    zoom: 15,
    userOrigin: [22.3898, 114.2002],
    bounds: [[22.3384,114.1382],[22.4412,114.2622]],
    facilities: [
        { type: 'info', name: 'Sha Tin & Ma On Shan Visitor Information', coords: [22.3898, 114.2002], emoji: 'ℹ️' },
        { type: 'restroom', name: 'Public Restroom Facilities', coords: [22.3918, 114.2022], emoji: '🚻' },
        { type: 'photo', name: 'Scenic Photography Spot', coords: [22.3878, 114.1982], emoji: '📷' },
    ],
    landmarks: [
        {
                "id": "st-newtown",
                "name": "New Town Plaza (新城市廣場)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.3812,
                        114.189
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n        </svg>\n      ",
                "tag": "MALL",
                "desc": "Premier multi-phase shopping and dining mega-complex, directly connected to Sha Tin MTR station with international flagship stores.",
                "audioNote": "Welcome to New Town Plaza, the bustling commercial and lifestyle heart of Sha Tin.",
                "panoUrl": "",
                "tips": "Direct pedestrian footbridge connections link all central Sha Tin plazas.",
                "importanceScore": 92,
                "prominenceTier": 1
        },
        {
                "id": "st-hilton",
                "name": "Hilton Plaza (希爾頓中心)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.3803,
                        114.1882
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n        </svg>\n      ",
                "tag": "MALL",
                "desc": "Popular shopping mall in central Sha Tin featuring diverse retail boutiques, tech shops, local eateries, and daily services.",
                "audioNote": "Hilton Plaza offers a bustling community shopping hub seamlessly connected to New Town Plaza Phase 3.",
                "panoUrl": "",
                "tips": "Connected via air-conditioned footbridge to Chanway Shopping Centre and New Town Plaza.",
                "importanceScore": 84,
                "prominenceTier": 1
        },
        {
                "id": "st-chanway",
                "name": "Chanway Shopping Centre (偉華商場)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.3814,
                        114.1878
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n        </svg>\n      ",
                "tag": "MALL",
                "desc": "Convenient shopping arcade adjacent to Sha Tin Station, housing casual bakeries, supermarkets, and local dining.",
                "audioNote": "You have arrived at Chanway Shopping Centre, right beside Sha Tin Station.",
                "panoUrl": "",
                "tips": "Quick transit passage between Sha Tin Station and Hilton Plaza.",
                "importanceScore": 80,
                "prominenceTier": 2
        },
        {
                "id": "st-yata",
                "name": "Yata Department Store (一田百貨)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.3798,
                        114.1888
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n        </svg>\n      ",
                "tag": "DEPT STORE",
                "desc": "Flagship Japanese-style modern department store and premium gourmet food market situated at New Town Plaza Phase 3.",
                "audioNote": "Yata is renowned for imported Japanese groceries, cosmetics, fresh patisseries, and seasonal lifestyle goods.",
                "panoUrl": "",
                "tips": "Visit the lower level gourmet food court for authentic Japanese street snacks.",
                "importanceScore": 86,
                "prominenceTier": 1
        },
        {
                "id": "st-lucky-plaza",
                "name": "Lucky Plaza (好運中心)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.3826,
                        114.1895
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n        </svg>\n      ",
                "tag": "MALL",
                "desc": "Vibrant renovated retail center featuring a bustling fresh food hall, international restaurants, and specialty boutiques.",
                "audioNote": "Lucky Plaza serves as a lively dining and shopping destination bridging Sha Tin Central and Lek Yuen.",
                "panoUrl": "",
                "tips": "Great variety of casual noodles and bubble tea stalls on the second floor.",
                "importanceScore": 78,
                "prominenceTier": 2
        },
        {
                "id": "st-shatin-centre",
                "name": "Shatin Centre (沙田中心)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.382,
                        114.1887
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n        </svg>\n      ",
                "tag": "MALL",
                "desc": "Interconnected retail arcade featuring clothing boutiques, pharmacies, electronics, and footbridge connections.",
                "audioNote": "Shatin Centre forms a vital part of the elevated pedestrian network connecting central Sha Tin estates.",
                "panoUrl": "",
                "tips": "Offers direct covered bridge connection to New Town Plaza and Sha Tin Station.",
                "importanceScore": 76,
                "prominenceTier": 2
        },
        {
                "id": "st-citylink",
                "name": "Citylink Plaza (連城廣場)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.3828,
                        114.1876
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n        </svg>\n      ",
                "tag": "MALL",
                "desc": "Retail podium built directly atop Sha Tin MTR station with specialty fashion, books, electronics, and noodle cafes.",
                "audioNote": "Citylink Plaza sits right above the station concourse, offering immediate commuter shopping.",
                "panoUrl": "",
                "tips": "Direct escalator entrance from Sha Tin MTR concourse ticket gates.",
                "importanceScore": 78,
                "prominenceTier": 2
        },
        {
                "id": "st-heritage-museum",
                "name": "Hong Kong Heritage Museum (香港文化博物館)",
                "category": "history",
                "color": "#b23b23",
                "coords": [
                        22.3768,
                        114.1861
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#b23b23\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏛️</text>\n        </svg>\n      ",
                "tag": "MUSEUM",
                "desc": "Comprehensive museum presenting the history, art, Cantonese opera heritage, and vibrant popular culture of Hong Kong.",
                "audioNote": "The Heritage Museum showcases iconic exhibitions of Bruce Lee, Cantopop, and Jin Yong martial arts literature.",
                "panoUrl": "",
                "tips": "Scenic 10-minute riverside stroll along Shing Mun River from Che Kung Temple.",
                "importanceScore": 92,
                "prominenceTier": 1
        },
        {
                "id": "st-chekung",
                "name": "Che Kung Temple (車公廟)",
                "category": "culture",
                "color": "#c2410c",
                "coords": [
                        22.3732,
                        114.1828
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#c2410c\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">⛩️</text>\n        </svg>\n      ",
                "tag": "TEMPLE",
                "desc": "Historic Taoist temple dedicated to Song dynasty general Che Kung, famous for revolving brass pinwheels turned for good fortune.",
                "audioNote": "Worshippers spin the brass windmills three times clockwise to bring good luck in health and fortune.",
                "panoUrl": "",
                "tips": "Major traditional pilgrimage site during Lunar New Year.",
                "importanceScore": 88,
                "prominenceTier": 1
        },
        {
                "id": "st-ten-thousand-buddhas",
                "name": "Ten Thousand Buddhas Monastery (萬佛寺)",
                "category": "culture",
                "color": "#c2410c",
                "coords": [
                        22.3875,
                        114.1848
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#c2410c\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">⛩️</text>\n        </svg>\n      ",
                "tag": "TEMPLE",
                "desc": "Striking mid-century monastery complex perched on Po Fook Hill, approached by a staircase flanked by over 12,000 unique gilded statues.",
                "audioNote": "Climb the 400 stone steps lined with life-sized gold Arhat statues to reach the nine-story pagoda.",
                "panoUrl": "",
                "tips": "The nine-story red pagoda is featured on the 100 HKD banknote.",
                "importanceScore": 86,
                "prominenceTier": 1
        },
        {
                "id": "st-snoopy",
                "name": "Snoopy's World (史諾比開心世界)",
                "category": "landmark",
                "color": "#0284c7",
                "coords": [
                        22.3822,
                        114.1901
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#0284c7\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🎡</text>\n        </svg>\n      ",
                "tag": "ATTRACTION",
                "desc": "Charming outdoor Peanuts theme park located on the third-floor podium of New Town Plaza, featuring life-sized character statues and canoe rides.",
                "audioNote": "Snoopy’s World is Asia’s first Peanuts outdoor attraction, completed in 2000.",
                "panoUrl": "",
                "tips": "Admission is free; great whimsical photo spot for families and Peanuts fans.",
                "importanceScore": 82,
                "prominenceTier": 1
        },
        {
                "id": "st-shatin-park",
                "name": "Sha Tin Park (沙田公園)",
                "category": "nature",
                "color": "#3d7a42",
                "coords": [
                        22.38,
                        114.1915
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#3d7a42\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🌿</text>\n        </svg>\n      ",
                "tag": "PARK",
                "desc": "Expansive riverside urban park with Chinese classical gardens, arched stone bridges, lotus ponds, and manicured lawns.",
                "audioNote": "Sha Tin Park provides an oasis of greenery separating the shopping malls from the Shing Mun River.",
                "panoUrl": "",
                "tips": "Features outdoor ampitheatre and quiet shaded pavilions overlooking the water.",
                "importanceScore": 80,
                "prominenceTier": 2
        },
        {
                "id": "st-town-hall",
                "name": "Sha Tin Town Hall (沙田大會堂)",
                "category": "culture",
                "color": "#b23b23",
                "coords": [
                        22.3812,
                        114.1902
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#b23b23\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🎭</text>\n        </svg>\n      ",
                "tag": "CULTURE",
                "desc": "Major regional performing arts complex hosting symphonies, classical Chinese theatre, ballets, and cultural exhibitions.",
                "audioNote": "The Town Hall forms the heart of Sha Tin’s civic plaza alongside the Central Library.",
                "panoUrl": "",
                "tips": "Spacious outdoor courtyard often hosts weekend artisanal craft markets.",
                "importanceScore": 78,
                "prominenceTier": 2
        },
        {
                "id": "st-library",
                "name": "Sha Tin Public Library (沙田公共圖書館)",
                "category": "culture",
                "color": "#b23b23",
                "coords": [
                        22.3815,
                        114.1911
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#b23b23\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">📚</text>\n        </svg>\n      ",
                "tag": "CULTURE",
                "desc": "Major regional public library with tiered reading rooms, outdoor terrace gardens, and extensive collections.",
                "audioNote": "The library stands as an architectural emblem of the 1980s new town cultural civic masterplan.",
                "panoUrl": "",
                "tips": "Quiet reading gardens on upper outdoor decks overlooking Sha Tin Park.",
                "importanceScore": 72,
                "prominenceTier": 2
        },
        {
                "id": "st-station",
                "name": "Sha Tin MTR Station (沙田站)",
                "category": "history",
                "color": "#4f46e5",
                "coords": [
                        22.3827,
                        114.1872
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#4f46e5\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🚇</text>\n        </svg>\n      ",
                "tag": "TRANSIT",
                "desc": "Major East Rail Line transport hub directly connecting downtown Kowloon, Shenzhen border, and central Sha Tin.",
                "audioNote": "Originally opened in 1910 on the Kowloon-Canton Railway, now a modern mega-transit interchange.",
                "panoUrl": "",
                "tips": "Direct covered walkways connect to New Town Plaza, Citylink, and the central bus terminal.",
                "importanceScore": 82,
                "prominenceTier": 1
        },
        {
                "id": "st-tsang-tai-uk",
                "name": "Tsang Tai Uk Walled Village (曾大屋)",
                "category": "history",
                "color": "#c14937",
                "coords": [
                        22.3752,
                        114.1918
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#c14937\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏰</text>\n        </svg>\n      ",
                "tag": "HERITAGE",
                "desc": "One of the best preserved Hakka fortified walled villages in Hong Kong, completed in 1867 with granite walls and watchtowers.",
                "audioNote": "Built by the Tsang clan during the Qing dynasty, featuring granite masonry, ancestral halls, and gun loops.",
                "panoUrl": "",
                "tips": "The inner central courtyards and historic ancestral shrine remain open to respectful visitors.",
                "importanceScore": 80,
                "prominenceTier": 2
        },
        {
                "id": "st-tao-fong-shan",
                "name": "Tao Fong Shan Christian Centre (道風山基督教叢林)",
                "category": "culture",
                "color": "#c2410c",
                "coords": [
                        22.3865,
                        114.1845
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#c2410c\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">⛪</text>\n        </svg>\n      ",
                "tag": "CHURCH",
                "desc": "Historic Christian retreat founded in 1930 designed in traditional Chinese Buddhist pagoda temple architecture by Johannes Prip-Møller.",
                "audioNote": "Tao Fong Shan features a 12-meter giant outdoor cross overlooking the Sha Tin valley.",
                "panoUrl": "",
                "tips": "Tranquil meditation garden and hand-painted Christian porcelain studio.",
                "importanceScore": 78,
                "prominenceTier": 2
        },
        {
                "id": "st-shing-mun-river",
                "name": "Shing Mun River Promenade (城門河長廊)",
                "category": "nature",
                "color": "#0284c7",
                "coords": [
                        22.3835,
                        114.1935
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#0284c7\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🌊</text>\n        </svg>\n      ",
                "tag": "RIVERSIDE",
                "desc": "Panoramic waterfront walking and cycling promenade along the channel, host to dragon boat races and night strolls.",
                "audioNote": "The 7-kilometer river promenade is beloved by joggers, cyclists, and dragon boat crews.",
                "panoUrl": "",
                "tips": "Rent a bicycle near Tai Wai to ride north along the scenic coastal path to Tai Po.",
                "importanceScore": 80,
                "prominenceTier": 2
        },
        {
                "id": "st-lek-yuen-bridge",
                "name": "Lek Yuen Bridge (瀝源橋)",
                "category": "landmark",
                "color": "#0284c7",
                "coords": [
                        22.3838,
                        114.1928
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#0284c7\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🌉</text>\n        </svg>\n      ",
                "tag": "BRIDGE",
                "desc": "Graceful white arched pedestrian bridge crossing the Shing Mun River, providing sweeping views of the rowing channels.",
                "audioNote": "Lek Yuen Bridge is one of the most photographed bridges in the New Territories.",
                "panoUrl": "",
                "tips": "Stunning sunset reflection vantage point looking downriver toward Tolo Harbour.",
                "importanceScore": 75,
                "prominenceTier": 2
        },
        {
                "id": "st-penfold-park",
                "name": "Penfold Park (彭福公園)",
                "category": "nature",
                "color": "#3d7a42",
                "coords": [
                        22.4002,
                        114.2055
                ],
                "svgSnippet": "\n        <svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n          <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#3d7a42\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n          <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🌳</text>\n        </svg>\n      ",
                "tag": "PARK",
                "desc": "Sprawling 20-acre lush park in the infield of Sha Tin Racecourse, boasting man-made lakes, waterfowl habitats, and rolling lawns.",
                "audioNote": "Penfold Park hosted equestrian events during the 2008 Olympic Games.",
                "panoUrl": "",
                "tips": "Open to the public on non-race days; highly popular pet-friendly meadow.",
                "importanceScore": 76,
                "prominenceTier": 2
        },
        {
                "id": "hk-shaTin-node-1952403570",
                "name": "Shek Lung Tsai Village (石壟仔村)",
                "category": "history",
                "color": "#b23b23",
                "coords": [
                        22.394579,
                        114.241152
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#b23b23\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏛️</text>\n</svg>",
                "tag": "HERITAGE",
                "desc": "Historic cultural exhibition and heritage landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Shek Lung Tsai Village, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 94,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-node-2329414919",
                "name": "Shan Mei (山尾)",
                "category": "history",
                "color": "#b23b23",
                "coords": [
                        22.406045,
                        114.180444
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#b23b23\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏛️</text>\n</svg>",
                "tag": "HERITAGE",
                "desc": "Historic cultural exhibition and heritage landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Shan Mei, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 94,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-node-2329414923",
                "name": "Shek Lau Tung (石榴洞)",
                "category": "history",
                "color": "#b23b23",
                "coords": [
                        22.408649,
                        114.171995
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#b23b23\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏛️</text>\n</svg>",
                "tag": "HERITAGE",
                "desc": "Historic cultural exhibition and heritage landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Shek Lau Tung, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 94,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-node-4796652880",
                "name": "Tao Heung Museum of Food Culture (稻鄉飲食文化博物館)",
                "category": "history",
                "color": "#b23b23",
                "coords": [
                        22.395973,
                        114.196226
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#b23b23\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏛️</text>\n</svg>",
                "tag": "MUSEUM",
                "desc": "Historic cultural exhibition and heritage landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Tao Heung Museum of Food Culture, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "Opening hours: Tu-Su 09:30-12:30, 14:30-17:30",
                "importanceScore": 94,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-node-5097630742",
                "name": "Jockey Club Museum of Climate Change (賽馬會氣候變化博物館)",
                "category": "history",
                "color": "#b23b23",
                "coords": [
                        22.416077,
                        114.211127
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#b23b23\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏛️</text>\n</svg>",
                "tag": "MUSEUM",
                "desc": "Historic cultural exhibition and heritage landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Jockey Club Museum of Climate Change, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "Opening hours: Mo-Tu 09:30-17:00, Th-Sa 09:30-17:00",
                "importanceScore": 94,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-node-9646715643",
                "name": "Cheung Lek Mei (長瀝尾)",
                "category": "history",
                "color": "#b23b23",
                "coords": [
                        22.413471,
                        114.190141
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#b23b23\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏛️</text>\n</svg>",
                "tag": "HERITAGE",
                "desc": "Historic cultural exhibition and heritage landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Cheung Lek Mei, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 94,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-node-10064169722",
                "name": "Au Pui Wan (坳背灣)",
                "category": "history",
                "color": "#b23b23",
                "coords": [
                        22.407355,
                        114.175087
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#b23b23\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏛️</text>\n</svg>",
                "tag": "HERITAGE",
                "desc": "Historic cultural exhibition and heritage landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Au Pui Wan, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 94,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-1231073538",
                "name": "Beacon Hill Tunnel (煙墩山隧道)",
                "category": "history",
                "color": "#b23b23",
                "coords": [
                        22.349241,
                        114.172715
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#b23b23\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏛️</text>\n</svg>",
                "tag": "HERITAGE",
                "desc": "Historic cultural exhibition and heritage landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Beacon Hill Tunnel, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 94,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-node-9581923710",
                "name": "Shatin Anglican Church (香港聖公會沙田堂)",
                "category": "culture",
                "color": "#c2410c",
                "coords": [
                        22.384358,
                        114.204397
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#c2410c\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">⛪</text>\n</svg>",
                "tag": "CHURCH",
                "desc": "Historic church and sacred landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Shatin Anglican Church, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 92,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-137251827",
                "name": "St. Alfred's Church (聖歐爾發堂)",
                "category": "culture",
                "color": "#c2410c",
                "coords": [
                        22.376282,
                        114.183886
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#c2410c\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">⛪</text>\n</svg>",
                "tag": "CHURCH",
                "desc": "Historic church and sacred landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to St. Alfred's Church, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 92,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-193660643",
                "name": "Koon Ngam Ching Yuen (古巖淨苑)",
                "category": "culture",
                "color": "#c2410c",
                "coords": [
                        22.373893,
                        114.184401
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#c2410c\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">⛩️</text>\n</svg>",
                "tag": "TEMPLE",
                "desc": "Historic temple and sacred landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Koon Ngam Ching Yuen, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 92,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-218462869",
                "name": "Hop Yat Church Ma On Shan Church The Church of Christ in China (中華基督教會合一堂馬鞍山堂)",
                "category": "culture",
                "color": "#c2410c",
                "coords": [
                        22.424388,
                        114.233809
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#c2410c\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">⛪</text>\n</svg>",
                "tag": "CHURCH",
                "desc": "Historic church and sacred landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Hop Yat Church Ma On Shan Church The Church of Christ in China, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 92,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-916943187",
                "name": "Ten Thousand Buddha's Monastery (萬佛寺)",
                "category": "culture",
                "color": "#c2410c",
                "coords": [
                        22.387905,
                        114.185083
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#c2410c\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">⛩️</text>\n</svg>",
                "tag": "TEMPLE",
                "desc": "Historic temple and sacred landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Ten Thousand Buddha's Monastery, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "Opening hours: Mo-Su 09:00-17:00",
                "importanceScore": 92,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-node-3017941122",
                "name": "Shatin Park Phase 1 (花園城第1期)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.379132,
                        114.197314
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n</svg>",
                "tag": "MALL",
                "desc": "Major shopping, dining, and retail complex in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Shatin Park Phase 1, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 86,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-node-3017941125",
                "name": "Shatin Park Phase 3 (花園城第3期)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.380043,
                        114.197873
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n</svg>",
                "tag": "MALL",
                "desc": "Major shopping, dining, and retail complex in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Shatin Park Phase 3, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 86,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-node-4472119947",
                "name": "Tai Po Road Lookout (大埔道瞭望處)",
                "category": "nature",
                "color": "#0284c7",
                "coords": [
                        22.359824,
                        114.161625
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#0284c7\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">📷</text>\n</svg>",
                "tag": "VIEW",
                "desc": "Panoramic viewpoint and scenic vantage in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Tai Po Road Lookout, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 92,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-156336198",
                "name": "We Go Mall",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.414232,
                        114.22382
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n</svg>",
                "tag": "MALL",
                "desc": "Major shopping, dining, and retail complex in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to We Go Mall, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-157655584",
                "name": "Sha Tin Centre (沙田中心)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.382651,
                        114.19006
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n</svg>",
                "tag": "MALL",
                "desc": "Major shopping, dining, and retail complex in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Sha Tin Centre, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-157655586",
                "name": "Sha Tin Plaza (沙田廣場)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.383267,
                        114.189187
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n</svg>",
                "tag": "MALL",
                "desc": "Major shopping, dining, and retail complex in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Sha Tin Plaza, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-169669027",
                "name": "Lee On Shopping Centre (利安商場)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.426576,
                        114.24095
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n</svg>",
                "tag": "MALL",
                "desc": "Major shopping, dining, and retail complex in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Lee On Shopping Centre, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-174682547",
                "name": "Chung On Shopping Centre (頌安商場)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.421864,
                        114.22654
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n</svg>",
                "tag": "MALL",
                "desc": "Major shopping, dining, and retail complex in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Chung On Shopping Centre, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-218817219",
                "name": "Ma On Shan Plaza (馬鞍山廣場)",
                "category": "landmark",
                "color": "#9333ea",
                "coords": [
                        22.425321,
                        114.231439
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#9333ea\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🛍️</text>\n</svg>",
                "tag": "MALL",
                "desc": "Major shopping, dining, and retail complex in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Ma On Shan Plaza, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-185266977",
                "name": "Hyatt Regency Hong Kong, Sha Tin (香港沙田凱悅酒店)",
                "category": "landmark",
                "color": "#6366f1",
                "coords": [
                        22.411651,
                        114.211235
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#6366f1\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏨</text>\n</svg>",
                "tag": "HOTEL",
                "desc": "Premier visitor accommodations and hospitality in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Hyatt Regency Hong Kong, Sha Tin, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-1467369750",
                "name": "Royal Park Hotel (帝都酒店)",
                "category": "landmark",
                "color": "#6366f1",
                "coords": [
                        22.379756,
                        114.188525
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#6366f1\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏨</text>\n</svg>",
                "tag": "HOTEL",
                "desc": "Premier visitor accommodations and hospitality in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Royal Park Hotel, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-37518291",
                "name": "Hin Tin Playground (顯田遊樂場)",
                "category": "nature",
                "color": "#15803d",
                "coords": [
                        22.364772,
                        114.171568
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#15803d\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🌿</text>\n</svg>",
                "tag": "PARK",
                "desc": "Scenic public gardens and greenery in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Hin Tin Playground, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-86248163",
                "name": "Wong Uk Garden (王屋花園)",
                "category": "nature",
                "color": "#15803d",
                "coords": [
                        22.382788,
                        114.197405
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#15803d\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🌿</text>\n</svg>",
                "tag": "PARK",
                "desc": "Scenic public gardens and greenery in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Wong Uk Garden, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-86329008",
                "name": "Yuen Chau Kok Park (圓洲角公園)",
                "category": "nature",
                "color": "#15803d",
                "coords": [
                        22.383013,
                        114.199345
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#15803d\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🌿</text>\n</svg>",
                "tag": "PARK",
                "desc": "Scenic public gardens and greenery in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Yuen Chau Kok Park, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "Opening hours: Mo-Su 06:30-23:00",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-136461577",
                "name": "Shing Mun River Promenade Garden No.1 (城門河第一海濱公園)",
                "category": "nature",
                "color": "#15803d",
                "coords": [
                        22.377196,
                        114.190113
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#15803d\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🌿</text>\n</svg>",
                "tag": "PARK",
                "desc": "Scenic public gardens and greenery in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Shing Mun River Promenade Garden No.1, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-138461184",
                "name": "Hung Mui Kuk Road Playground (紅梅谷路遊樂場)",
                "category": "nature",
                "color": "#15803d",
                "coords": [
                        22.370271,
                        114.179304
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#15803d\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🌿</text>\n</svg>",
                "tag": "PARK",
                "desc": "Scenic public gardens and greenery in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Hung Mui Kuk Road Playground, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-145662000",
                "name": "A Kung Kok Playground (亞公角遊樂場)",
                "category": "nature",
                "color": "#15803d",
                "coords": [
                        22.401681,
                        114.216595
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#15803d\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🌿</text>\n</svg>",
                "tag": "PARK",
                "desc": "Scenic public gardens and greenery in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to A Kung Kok Playground, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 90,
                "prominenceTier": 1
        },
        {
                "id": "hk-shaTin-way-1077659336",
                "name": "ClubONE Riviera (會所1號 水中天)",
                "category": "craft",
                "color": "#dc2626",
                "coords": [
                        22.389883,
                        114.203156
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#dc2626\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🍽️</text>\n</svg>",
                "tag": "RESTAURANT",
                "desc": "Renowned cuisine (cantonese) in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to ClubONE Riviera, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 85,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-node-2130611963",
                "name": "Canoe Rock (獨木舟石)",
                "category": "landmark",
                "color": "#0284c7",
                "coords": [
                        22.396418,
                        114.246236
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#0284c7\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🎡</text>\n</svg>",
                "tag": "ATTRACTION",
                "desc": "Major visitor attraction and landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Canoe Rock, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 82,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-node-3151878479",
                "name": "陽元石",
                "category": "landmark",
                "color": "#0284c7",
                "coords": [
                        22.389534,
                        114.22756
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#0284c7\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🎡</text>\n</svg>",
                "tag": "ATTRACTION",
                "desc": "Major visitor attraction and landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to 陽元石, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 82,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-node-4436569965",
                "name": "花心石",
                "category": "landmark",
                "color": "#0284c7",
                "coords": [
                        22.382522,
                        114.222145
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#0284c7\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🎡</text>\n</svg>",
                "tag": "ATTRACTION",
                "desc": "Major visitor attraction and landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to 花心石, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 82,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-node-4828151922",
                "name": "Pig Rock (真肥豬石)",
                "category": "landmark",
                "color": "#0284c7",
                "coords": [
                        22.400898,
                        114.237884
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#0284c7\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🎡</text>\n</svg>",
                "tag": "ATTRACTION",
                "desc": "Major visitor attraction and landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Pig Rock, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 82,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-node-4839613216",
                "name": "Frog Rock (青蛙石)",
                "category": "landmark",
                "color": "#0284c7",
                "coords": [
                        22.410333,
                        114.232538
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#0284c7\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🎡</text>\n</svg>",
                "tag": "ATTRACTION",
                "desc": "Major visitor attraction and landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Frog Rock, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 82,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-node-4839621573",
                "name": "鱷魚張口",
                "category": "landmark",
                "color": "#0284c7",
                "coords": [
                        22.396385,
                        114.246163
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#0284c7\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🎡</text>\n</svg>",
                "tag": "ATTRACTION",
                "desc": "Major visitor attraction and landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to 鱷魚張口, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 82,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-node-9259959494",
                "name": "中尉石室",
                "category": "landmark",
                "color": "#0284c7",
                "coords": [
                        22.392815,
                        114.244703
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#0284c7\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🎡</text>\n</svg>",
                "tag": "ATTRACTION",
                "desc": "Major visitor attraction and landmark in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to 中尉石室, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 82,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-way-135190719",
                "name": "University Guest House (Chiangs Bldg.) (大學賓館 (曙光樓))",
                "category": "landmark",
                "color": "#6366f1",
                "coords": [
                        22.420077,
                        114.21067
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#6366f1\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏨</text>\n</svg>",
                "tag": "HOTEL",
                "desc": "Premier visitor accommodations and hospitality in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to University Guest House (Chiangs Bldg.), one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 75,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-way-135190720",
                "name": "Yali Guest House (雅禮賓館)",
                "category": "landmark",
                "color": "#6366f1",
                "coords": [
                        22.419718,
                        114.210788
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#6366f1\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏨</text>\n</svg>",
                "tag": "HOTEL",
                "desc": "Premier visitor accommodations and hospitality in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Yali Guest House, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 75,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-way-157655576",
                "name": "Regal Riverside Hotel (麗豪酒店)",
                "category": "landmark",
                "color": "#6366f1",
                "coords": [
                        22.38231,
                        114.196535
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#6366f1\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏨</text>\n</svg>",
                "tag": "HOTEL",
                "desc": "Premier visitor accommodations and hospitality in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Regal Riverside Hotel, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 75,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-way-162813703",
                "name": "Ascension House (昇天屋)",
                "category": "landmark",
                "color": "#6366f1",
                "coords": [
                        22.383636,
                        114.184489
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#6366f1\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🏨</text>\n</svg>",
                "tag": "HOTEL",
                "desc": "Premier visitor accommodations and hospitality in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Ascension House, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 75,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-node-1704060211",
                "name": "McDonald's (麥當勞)",
                "category": "craft",
                "color": "#dc2626",
                "coords": [
                        22.375355,
                        114.193489
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#dc2626\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🍔</text>\n</svg>",
                "tag": "FAST FOOD",
                "desc": "Renowned cuisine (burger) in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to McDonald's, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 68,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-node-1746335683",
                "name": "新光酒樓",
                "category": "craft",
                "color": "#dc2626",
                "coords": [
                        22.385104,
                        114.1992
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#dc2626\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🍽️</text>\n</svg>",
                "tag": "RESTAURANT",
                "desc": "Renowned cuisine (chinese) in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to 新光酒樓, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 68,
                "prominenceTier": 3
        },
        {
                "id": "hk-shaTin-node-2036810031",
                "name": "Subway",
                "category": "craft",
                "color": "#dc2626",
                "coords": [
                        22.419546,
                        114.208551
                ],
                "svgSnippet": "<svg viewBox=\"0 0 100 100\" class=\"w-full h-full drop-shadow-md\">\n  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#dc2626\" stroke=\"#2b261b\" stroke-width=\"3\"/>\n  <text x=\"50\" y=\"58\" font-size=\"22\" text-anchor=\"middle\">🍔</text>\n</svg>",
                "tag": "FAST FOOD",
                "desc": "Renowned cuisine (sandwich) in Hong Kong • Sha Tin & Ma On Shan.",
                "audioNote": "Welcome to Subway, one of the key landmarks in Hong Kong • Sha Tin & Ma On Shan.",
                "panoUrl": "",
                "tips": "",
                "importanceScore": 68,
                "prominenceTier": 3
        }
],
};

export const HONG_KONG_PACK = HONG_KONG_SHA_TIN_PACK;