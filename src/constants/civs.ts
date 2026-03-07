export interface Civilization {
  id: string;
  name: string;
  theme: {
    primary: string;
    secondary: string;
  };
  abbr: string;
  slug: string;
}

export const CIV_FLAG_BASE_URL = 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/flags';

export const getCivFlagUrl = (civ: Civilization) => `${CIV_FLAG_BASE_URL}/${civ.slug}.png`;

export const CIVS: Civilization[] = [
  { id: 'ab', abbr: 'abb', slug: 'abbasid', name: 'Abbasid Dynasty', theme: { primary: '#1A1A1A', secondary: '#C9A84C' } },
  { id: 'ay', abbr: 'ayy', slug: 'ayyubids', name: 'Ayyubids', theme: { primary: '#7B1818', secondary: '#D4A843' } },
  { id: 'by', abbr: 'byz', slug: 'byzantines', name: 'Byzantines', theme: { primary: '#5E2066', secondary: '#D4AF37' } },
  { id: 'ch', abbr: 'chi', slug: 'chinese', name: 'Chinese', theme: { primary: '#CC2020', secondary: '#FFD700' } },
  { id: 'de', abbr: 'del', slug: 'delhi', name: 'Delhi Sultanate', theme: { primary: '#1B6B20', secondary: '#E8F0E8' } },
  { id: 'en', abbr: 'eng', slug: 'english', name: 'English', theme: { primary: '#C41E1E', secondary: '#FFFFFF' } },
  { id: 'fr', abbr: 'fre', slug: 'french', name: 'French', theme: { primary: '#1A3A7A', secondary: '#D4AF37' } },
  { id: 'gol', abbr: 'gol', slug: 'goldenhorde', name: 'Golden Horde', theme: { primary: '#2C3E50', secondary: '#D4AF37' } },
  { id: 'hr', abbr: 'hre', slug: 'hre', name: 'Holy Roman Empire', theme: { primary: '#D4A017', secondary: '#1A1A1A' } },
  { id: 'hl', abbr: 'hol', slug: 'lancaster', name: 'House of Lancaster', theme: { primary: '#8B1A1A', secondary: '#E8D5D5' } },
  { id: 'ja', abbr: 'jap', slug: 'japanese', name: 'Japanese', theme: { primary: '#BA2025', secondary: '#FAFAFA' } },
  { id: 'je', abbr: 'jda', slug: 'jeannedarc', name: "Jeanne d'Arc", theme: { primary: '#1A3A7A', secondary: '#D4AF37' } },
  { id: 'kt', abbr: 'kt', slug: 'templar', name: 'Knights Templar', theme: { primary: '#8B1A1A', secondary: '#FFFFFF' } },
  { id: 'mac', abbr: 'mac', slug: 'macedonian', name: 'Macedonian Dynasty', theme: { primary: '#4A1942', secondary: '#D4AF37' } },
  { id: 'ma', abbr: 'mal', slug: 'malians', name: 'Malians', theme: { primary: '#D4571E', secondary: '#D4AF37' } },
  { id: 'mo', abbr: 'mon', slug: 'mongols', name: 'Mongols', theme: { primary: '#1E4D8C', secondary: '#D4AF37' } },
  { id: 'od', abbr: 'otd', slug: 'orderofthedragon', name: 'Order of the Dragon', theme: { primary: '#8B7514', secondary: '#1A1A1A' } },
  { id: 'ot', abbr: 'ott', slug: 'ottomans', name: 'Ottomans', theme: { primary: '#1A5C38', secondary: '#C9A84C' } },
  { id: 'ru', abbr: 'rus', slug: 'rus', name: 'Rus', theme: { primary: '#8B1A22', secondary: '#D4A843' } },
  { id: 'sen', abbr: 'sen', slug: 'sengoku', name: 'Sengoku Daimyo', theme: { primary: '#8B1A22', secondary: '#D4AF37' } },
  { id: 'tug', abbr: 'tug', slug: 'tughlaq', name: 'Tughlaq Dynasty', theme: { primary: '#1A5C20', secondary: '#A8D5A0' } },
  { id: 'zx', abbr: 'zxl', slug: 'zhuxi', name: "Zhu Xi's Legacy", theme: { primary: '#C47A1E', secondary: '#1A1A1A' } },
];
