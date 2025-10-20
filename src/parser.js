const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

// === ФЕДЕРАЛЬНЫЕ ОКРУГА ===
const FEDERAL_DISTRICTS = {
  'СЗФО': ['Санкт-Петербург', 'Республика Карелия', 'Мурманская область', 'Архангельская область', 'Вологодская область', 'Калининградская область', 'Ленинградская область', 'Новгородская область', 'Псковская область'],
  'ЦФО': ['Тверская область', 'Ярославская область', 'Владимирская область', 'Ивановская область', 'Костромская область', 'Рязанская область', 'Тульская область', 'Брянская область', 'Курская область', 'Орловская область', 'Смоленская область', 'Липецкая область', 'Тамбовская область'],
  'ПФО': ['Республика Татарстан', 'Самарская область', 'Ульяновская область', 'Пензенская область', 'Саратовская область', 'Волгоградская область', 'Астраханская область', 'Республика Башкортостан', 'Республика Мордовия', 'Республика Марий Эл', 'Чувашская Республика', 'Кировская область', 'Нижегородская область'],
  'УрФО': ['Свердловская область', 'Челябинская область', 'Курганская область', 'Тюменская область', 'Ханты-Мансийский АО', 'Ямало-Ненецкий АО'],
  'СФО': ['Республика Бурятия', 'Республика Тыва', 'Республика Хакасия', 'Алтайский край', 'Забайкальский край', 'Красноярский край', 'Иркутская область', 'Кемеровская область', 'Новосибирская область', 'Омская область', 'Томская область'],
  'ДФО': ['Республика Саха (Якутия)', 'Камчатский край', 'Приморский край', 'Хабаровский край', 'Амурская область', 'Магаданская область', 'Сахалинская область', 'Еврейская АО', 'Чукотский АО'],
  'ЮФО': ['Республика Адыгея', 'Республика Калмыкия', 'Краснодарский край', 'Астраханская область', 'Волгоградская область', 'Ростовская область'],
  'СКФО': ['Республика Дагестан', 'Республика Ингушетия', 'Кабардино-Балкарская Республика', 'Карачаево-Черкесская Республика', 'Республика Северная Осетия', 'Ставропольский край', 'Чеченская Республика']
};

// === РЕГИОНАЛЬНЫЕ СМИ (85 субъектов, без Москвы и МО) ===
const REGIONAL_SOURCES = [
  // СЗФО
  { region: 'Санкт-Петербург', city: 'Санкт-Петербург', coords: [30.3351, 59.9343], rss: 'https://www.fontanka.ru/fontanka.rss' },
  { region: 'Республика Карелия', city: 'Петрозаводск', coords: [34.3469, 61.7849], rss: 'https://karelia.news/rss' },
  { region: 'Мурманская область', city: 'Мурманск', coords: [33.0750, 68.9785], html: 'https://vm.ru/' },
  { region: 'Архангельская область', city: 'Архангельск', coords: [40.5434, 64.5397], rss: 'https://dvinatoday.ru/export/rss2/index.xml' },
  { region: 'Вологодская область', city: 'Вологда', coords: [39.8915, 59.2231], html: 'https://vologdaregion.ru/' },
  { region: 'Калининградская область', city: 'Калининград', coords: [20.5103, 54.7104], rss: 'https://kgd.ru/rss/news/' },
  { region: 'Ленинградская область', city: 'Санкт-Петербург', coords: [30.3351, 59.9343], rss: 'https://47news.ru/rss/' },
  { region: 'Новгородская область', city: 'Великий Новгород', coords: [31.2667, 58.5208], html: 'https://novgorod.ru/' },
  { region: 'Псковская область', city: 'Псков', coords: [28.3333, 57.8167], rss: 'https://pskov.ru/rss/' },

  // ЦФО
  { region: 'Тверская область', city: 'Тверь', coords: [35.9006, 56.8587], rss: 'https://tverigrad.ru/rss/' },
  { region: 'Ярославская область', city: 'Ярославль', coords: [39.8915, 57.6299], rss: 'https://yarkor.ru/rss/' },
  { region: 'Владимирская область', city: 'Владимир', coords: [40.4034, 56.1295], html: 'https://vladimirnews.ru/' },
  { region: 'Ивановская область', city: 'Иваново', coords: [40.9854, 56.9991], rss: 'https://ivanovo-news.ru/rss/' },
  { region: 'Костромская область', city: 'Кострома', coords: [40.9268, 57.7673], html: 'https://kostroma.media/' },
  { region: 'Рязанская область', city: 'Рязань', coords: [39.7833, 54.6269], rss: 'https://rg.ru/rss/' },
  { region: 'Тульская область', city: 'Тула', coords: [37.6156, 54.1961], html: 'https://tula.mk.ru/' },
  { region: 'Брянская область', city: 'Брянск', coords: [34.3701, 52.4334], rss: 'https://bryansk-news.net/rss/' },
  { region: 'Курская область', city: 'Курск', coords: [36.1930, 51.7308], rss: 'https://kurskmedia.ru/rss/' },
  { region: 'Орловская область', city: 'Орёл', coords: [36.0711, 52.9657], html: 'https://orel-region.ru/' },
  { region: 'Смоленская область', city: 'Смоленск', coords: [32.0443, 54.7818], rss: 'https://smolensk-i.ru/rss/' },
  { region: 'Липецкая область', city: 'Липецк', coords: [39.6000, 52.6031], html: 'https://lipetskmedia.ru/' },
  { region: 'Тамбовская область', city: 'Тамбов', coords: [41.4431, 52.7233], rss: 'https://tambov.gov.ru/press/news/rss/' },

  // ПФО
  { region: 'Республика Татарстан', city: 'Казань', coords: [49.1221, 55.8304], rss: 'https://kazanfirst.ru/rss' },
  { region: 'Самарская область', city: 'Самара', coords: [50.1001, 53.2001], html: 'https://63.ru/' },
  { region: 'Ульяновская область', city: 'Ульяновск', coords: [48.3930, 54.3280], rss: 'https://ulpravda.ru/rss/' },
  { region: 'Пензенская область', city: 'Пенза', coords: [45.0000, 53.1950], html: 'https://penzainform.ru/' },
  { region: 'Саратовская область', city: 'Саратов', coords: [46.0364, 51.5406], rss: 'https://sarnovosti.ru/rss/' },
  { region: 'Волгоградская область', city: 'Волгоград', coords: [44.5167, 48.7080], rss: 'https://v1.ru/rss' },
  { region: 'Астраханская область', city: 'Астрахань', coords: [48.0500, 46.3500], html: 'https://astrakhan.mk.ru/' },
  { region: 'Республика Башкортостан', city: 'Уфа', coords: [55.9587, 54.7348], rss: 'https://ufa1.ru/rss' },
  { region: 'Республика Мордовия', city: 'Саранск', coords: [45.1833, 54.1833], html: 'https://mordovmedia.ru/' },
  { region: 'Республика Марий Эл', city: 'Йошкар-Ола', coords: [47.8833, 56.6333], rss: 'https://marimedia.ru/rss/' },
  { region: 'Чувашская Республика', city: 'Чебоксары', coords: [47.2500, 56.1333], html: 'https://chuvashia.com/' },
  { region: 'Кировская область', city: 'Киров', coords: [49.6633, 58.6035], rss: 'https://kirovreg.ru/rss/' },
  { region: 'Нижегородская область', city: 'Нижний Новгород', coords: [44.0018, 56.3287], rss: 'https://vremyan.ru/rss/' },

  // УрФО
  { region: 'Свердловская область', city: 'Екатеринбург', coords: [60.6122, 56.8389], rss: 'https://www.ug.ru/rss' },
  { region: 'Челябинская область', city: 'Челябинск', coords: [61.4478, 55.1644], rss: 'https://www.chel.ru/rss' },
  { region: 'Курганская область', city: 'Курган', coords: [65.3333, 55.4500], html: 'https://kurganmedia.ru/' },
  { region: 'Тюменская область', city: 'Тюмень', coords: [65.5302, 57.1530], rss: 'https://tyumenpravda.ru/rss/' },
  { region: 'Ханты-Мансийский АО', city: 'Ханты-Мансийск', coords: [69.0000, 61.0000], html: 'https://ugra-news.ru/' },
  { region: 'Ямало-Ненецкий АО', city: 'Салехард', coords: [66.5333, 66.5333], html: 'https://ugra-news.ru/' },

  // СФО
  { region: 'Республика Бурятия', city: 'Улан-Удэ', coords: [107.5833, 51.8281], rss: 'https://www.buryatiya.ru/rss/' },
  { region: 'Республика Тыва', city: 'Кызыл', coords: [94.4333, 51.7167], html: 'https://tuvaonline.ru/' },
  { region: 'Республика Хакасия', city: 'Абакан', coords: [91.4333, 53.7167], html: 'https://19rus.ru/' },
  { region: 'Алтайский край', city: 'Барнаул', coords: [83.7578, 53.3547], rss: 'https://altapress.ru/rss/' },
  { region: 'Забайкальский край', city: 'Чита', coords: [113.4998, 52.0319], html: 'https://zabinfo.ru/' },
  { region: 'Красноярский край', city: 'Красноярск', coords: [92.8734, 56.0184], html: 'https://www.newslab.ru/krasnoyarsk' },
  { region: 'Иркутская область', city: 'Иркутск', coords: [104.2833, 52.2833], rss: 'https://irkutskmedia.ru/rss/' },
  { region: 'Кемеровская область', city: 'Кемерово', coords: [86.7431, 55.3431], rss: 'https://keminfo.ru/rss/' },
  { region: 'Новосибирская область', city: 'Новосибирск', coords: [82.9346, 55.0084], rss: 'https://nscn.ru/rss' },
  { region: 'Омская область', city: 'Омск', coords: [73.3682, 54.9887], rss: 'https://omskinform.ru/rss/' },
  { region: 'Томская область', city: 'Томск', coords: [84.9500, 56.4977], rss: 'https://tomsk.ru/rss/' },

  // ДФО
  { region: 'Республика Саха (Якутия)', city: 'Якутск', coords: [129.7333, 62.0333], rss: 'https://yakutia.info/rss/' },
  { region: 'Камчатский край', city: 'Петропавловск-Камчатский', coords: [158.6500, 53.0167], rss: 'https://kam24.ru/rss/' },
  { region: 'Приморский край', city: 'Владивосток', coords: [131.8855, 43.1056], rss: 'https://primamedia.ru/rss/' },
  { region: 'Хабаровский край', city: 'Хабаровск', coords: [135.0667, 48.4833], rss: 'https://khabar.khabarovsk.ru/rss/' },
  { region: 'Амурская область', city: 'Благовещенск', coords: [127.5333, 50.2833], html: 'https://amur.info/' },
  { region: 'Магаданская область', city: 'Магадан', coords: [150.8000, 59.5500], html: 'https://49.ru/magadan/' },
  { region: 'Сахалинская область', city: 'Южно-Сахалинск', coords: [142.7333, 46.9500], html: 'https://sakhalin.info/' },
  { region: 'Еврейская АО', city: 'Биробиджан', coords: [132.9333, 48.7833], html: 'https://eao.ru/' },
  { region: 'Чукотский АО', city: 'Анадырь', coords: [177.5000, 64.7333], html: 'https://chukotka.org/' },

  // ЮФО
  { region: 'Республика Адыгея', city: 'Майкоп', coords: [40.1000, 44.6067], rss: 'https://adynka.ru/rss/' },
  { region: 'Республика Калмыкия', city: 'Элиста', coords: [44.2833, 46.3067], html: 'https://kalmregion.ru/' },
  { region: 'Краснодарский край', city: 'Краснодар', coords: [38.9753, 45.0393], rss: 'https://yuga.ru/rss/news/' },
  { region: 'Ростовская область', city: 'Ростов-на-Дону', coords: [39.7231, 47.2357], rss: 'https://rostov161.ru/rss' },
  { region: 'Волгоградская область', city: 'Волгоград', coords: [44.5167, 48.7080], rss: 'https://v1.ru/rss' },
  { region: 'Астраханская область', city: 'Астрахань', coords: [48.0500, 46.3500], html: 'https://astrakhan.mk.ru/' },

  // СКФО
  { region: 'Республика Дагестан', city: 'Махачкала', coords: [47.5085, 42.9841], html: 'https://www.riadagestan.ru/' },
  { region: 'Республика Ингушетия', city: 'Магас', coords: [44.8033, 43.1667], html: 'https://ingushetia.ru/' },
  { region: 'Кабардино-Балкарская Республика', city: 'Нальчик', coords: [43.4939, 43.4811], rss: 'https://kbrria.ru/rss/' },
  { region: 'Карачаево-Черкесская Республика', city: 'Черкесск', coords: [42.0667, 44.2289], html: 'https://kchr.ru/' },
  { region: 'Республика Северная Осетия', city: 'Владикавказ', coords: [44.6833, 43.0333], html: 'https://iratta.ru/' },
  { region: 'Ставропольский край', city: 'Ставрополь', coords: [41.9733, 45.0428], rss: 'https://stavropolye.tv/rss/' },
  { region: 'Чеченская Республика', city: 'Грозный', coords: [45.6833, 43.3167], html: 'https://chechnya.today/' }
];

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function getDistrictByRegion(region) {
  for (const [district, regions] of Object.entries(FEDERAL_DISTRICTS)) {
    if (regions.includes(region)) return district;
  }
  return 'Другое';
}

async function parseRSS(url) {
  const parser = new Parser({ timeout: 10000 });
  try {
    const feed = await parser.parseURL(url);
    return feed.items || [];
  } catch (e) {
    console.warn(`⚠️ RSS парсинг не удался: ${url}`, e.message);
    return [];
  }
}

async function parseHTML({ url, city, coords }) {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'RussiaNewsMap/1.0 (+https://your-site.onrender.com)' }
    });
    const $ = cheerio.load(res.data);
    const items = [];
    $('article, .news-item, .post, .entry, .card').each((i, el) => {
      const title = $(el).find('h1, h2, h3, a').first().text().trim();
      const link = $(el).find('a').attr('href');
      const desc = $(el).find('p').first().text().trim();
      if (title && link) {
        items.push({
          title,
          description: desc,
          link: link.startsWith('http') ? link : new URL(link, url).href,
          pubDate: new Date(),
          city,
          lon: coords[0],
          lat: coords[1]
        });
      }
    });
    return items;
  } catch (e) {
    console.warn(`⚠️ HTML парсинг не удался: ${url}`, e.message);
    return [];
  }
}

// === ОСНОВНАЯ ФУНКЦИЯ ===
let cachedNews = [];
let lastFetch = 0;

async function fetchAndProcessNews() {
  const now = Date.now();
  if (now - lastFetch < 5 * 60 * 1000 && cachedNews.length > 0) {
    return cachedNews;
  }

  const allNews = [];

  for (const source of REGIONAL_SOURCES) {
    const { region, city, coords, rss, html } = source;
    const district = getDistrictByRegion(region);
    let items = [];

    if (rss) {
      const feedItems = await parseRSS(rss);
      items = feedItems.map(item => ({
        title: item.title.trim(),
        description: (item.contentSnippet || item.content || '').trim(),
        link: item.link,
        pubDate: new Date(item.pubDate || item.isoDate || Date.now()),
        city,
        lon: coords[0],
        lat: coords[1],
        district
      }));
    } else if (html) {
      const htmlItems = await parseHTML({ url: html, city, coords });
      items = htmlItems.map(item => ({ ...item, district }));
    }

    // Фильтрация: только если упоминается город или регион
    const filtered = items.filter(item => {
      const text = (item.title + ' ' + item.description).toLowerCase();
      return text.includes(city.toLowerCase()) || text.includes(region.toLowerCase());
    });

    allNews.push(...filtered);
  }

  // Удаление дубликатов
  const seen = new Set();
  const uniqueNews = allNews.filter(item => {
    const key = `${item.link}|${item.title}`.toLowerCase().replace(/\s+/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  cachedNews = uniqueNews;
  lastFetch = now;
  console.log(`✅ Загружено ${cachedNews.length} новостей`);
  return cachedNews;
}

module.exports = { fetchAndProcessNews };