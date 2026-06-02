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
  { id: 'ab', abbr: 'abb', slug: 'abbasid', name: 'Abbasid Dynasty', theme: { primary: '#3A3A3A', secondary: '#C9A84C' } },
  { id: 'ay', abbr: 'ayy', slug: 'ayyubids', name: 'Ayyubids', theme: { primary: '#D4A843', secondary: '#8B2020' } },
  { id: 'by', abbr: 'byz', slug: 'byzantines', name: 'Byzantines', theme: { primary: '#6B2FA0', secondary: '#D4AF37' } },
  { id: 'ch', abbr: 'chi', slug: 'chinese', name: 'Chinese', theme: { primary: '#CC2020', secondary: '#FFD700' } },
  { id: 'de', abbr: 'del', slug: 'delhi', name: 'Delhi Sultanate', theme: { primary: '#1E7A2A', secondary: '#2A2A2A' } },
  { id: 'en', abbr: 'eng', slug: 'english', name: 'English', theme: { primary: '#CC3333', secondary: '#F5F5F5' } },
  { id: 'fr', abbr: 'fre', slug: 'french', name: 'French', theme: { primary: '#3B6CB6', secondary: '#FFD700' } },
  { id: 'gol', abbr: 'gol', slug: 'goldenhorde', name: 'Golden Horde', theme: { primary: '#8C8C8C', secondary: '#B22222' } },
  { id: 'hr', abbr: 'hre', slug: 'hre', name: 'Holy Roman Empire', theme: { primary: '#E8B800', secondary: '#1A1A1A' } },
  { id: 'hl', abbr: 'hol', slug: 'lancaster', name: 'House of Lancaster', theme: { primary: '#1E3A5F', secondary: '#CC2020' } },
  { id: 'ja', abbr: 'jap', slug: 'japanese', name: 'Japanese', theme: { primary: '#D4A843', secondary: '#F5F5F5' } },
  { id: 'je', abbr: 'jda', slug: 'jeannedarc', name: "Jeanne d'Arc", theme: { primary: '#D4A843', secondary: '#2E5CB8' } },
  { id: 'kt', abbr: 'kt', slug: 'templar', name: 'Knights Templar', theme: { primary: '#3A3A3A', secondary: '#CC2020' } },
  { id: 'mac', abbr: 'mac', slug: 'macedonian', name: 'Macedonian Dynasty', theme: { primary: '#CC2020', secondary: '#FFD700' } },
  { id: 'ma', abbr: 'mal', slug: 'malians', name: 'Malians', theme: { primary: '#D4A843', secondary: '#2A2A2A' } },
  { id: 'mo', abbr: 'mon', slug: 'mongols', name: 'Mongols', theme: { primary: '#2E75B6', secondary: '#FFD700' } },
  { id: 'od', abbr: 'otd', slug: 'orderofthedragon', name: 'Order of the Dragon', theme: { primary: '#E8B800', secondary: '#1A1A1A' } },
  { id: 'ot', abbr: 'ott', slug: 'ottomans', name: 'Ottomans', theme: { primary: '#1E7A3A', secondary: '#F0F0F0' } },
  { id: 'ru', abbr: 'rus', slug: 'rus', name: 'Rus', theme: { primary: '#CC2020', secondary: '#F0F0F0' } },
  { id: 'sen', abbr: 'sen', slug: 'sengoku', name: 'Sengoku Daimyo', theme: { primary: '#CC2020', secondary: '#FFD700' } },
  { id: 'tug', abbr: 'tug', slug: 'tughlaq', name: 'Tughlaq Dynasty', theme: { primary: '#8A8A8A', secondary: '#2A2A2A' } },
  { id: 'zx', abbr: 'zxl', slug: 'zhuxi', name: "Zhu Xi's Legacy", theme: { primary: '#1A7A7A', secondary: '#F0F0F0' } },
];
