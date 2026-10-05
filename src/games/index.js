import { launchSubway } from './subway.js';
import { launchSoda } from './soda.js';
import { launchSodaCrush } from './sodacrush.js';
import { launchDrift } from './drift.js';
import { launchSlope } from './slope.js';
import { launch2048 } from './g2048.js';
import { launchReflex } from './reflex.js';
import { launchSpaceDodge } from './spacedodge.js';
import { launchCyberFlappy } from './cyberflappy.js';
import { launchMiner } from './miner.js';
import { launchSnake } from './snake.js';

export const GAMES_CATALOG = [
  {
    id: 'subway',
    title: 'SUBWAY DASH 3D',
    category: '3D Cheksiz Yugurish',
    icon: '🏃',
    badge: 'FLAGMAN 3D',
    color: 'linear-gradient(135deg, #ff0055, #ffaa00)',
    accent: '#ff0055',
    desc: 'Poyezdlar ustida yuguring, to‘siqlardan sakrab oltin tangalarni yig‘ing!',
    launcher: launchSubway
  },
  {
    id: 'sodacrush',
    title: 'CANDY SODA CRUSH',
    category: 'Match-3 & Soda Fizika',
    icon: '🍬',
    badge: 'AFSONA SAGA',
    color: 'linear-gradient(135deg, #d500f9, #00e5ff)',
    accent: '#d500f9',
    desc: '4-5 ta konfetlarni portlating, rangli bombalar va shved baliqchalarini yarating, soda shishalarini ochib binafsharang kiber-sodani ko‘taring!',
    launcher: launchSodaCrush
  },
  {
    id: 'soda',
    title: 'SODA GAME RUSH 3D',
    category: '3D Kiber Gaz & Yugurish',
    icon: '🥤',
    badge: 'YANGI • 3D',
    color: 'linear-gradient(135deg, #ff0077, #00f0ff)',
    accent: '#ff0077',
    desc: 'Kiber-soda idishini boshqaring, gaz pufaklarini yig‘ing va [Space] bilan kiber-turbo otilishni yoqing!',
    launcher: launchSoda
  },
  {
    id: 'drift',
    title: 'NEON DRIFT 3D',
    category: '3D Tezyurar Poyga',
    icon: '🏎️',
    badge: '3D ULTRA',
    color: 'linear-gradient(135deg, #00f0ff, #0066ff)',
    accent: '#00f0ff',
    desc: 'Tezyurar kiber magistralda to‘siqlarni chetlab o‘ting va rekord o‘rnating!',
    launcher: launchDrift
  },
  {
    id: 'slope',
    title: 'SLOPE 3D',
    category: '3D Ekstremal Dumalash',
    icon: '🔴',
    badge: 'AFSONAVIY',
    color: 'linear-gradient(135deg, #00ffcc, #0077ff)',
    accent: '#00ffcc',
    desc: 'Muallaq kiber-qiyaliklar bo‘ylab sharni qizil to‘siqlarga tekkizmasdan boshqaring.',
    launcher: launchSlope
  },
  {
    id: 'g2048',
    title: '2048 CYBER GLASS',
    category: 'Mantiqiy Puzzle',
    icon: '🧱',
    badge: 'MASHHUR',
    color: 'linear-gradient(135deg, #ff007f, #9900ee)',
    accent: '#ff007f',
    desc: 'Shishasimon neon plitkalarni birlashtirib 2048 kiber-yadrosini yarating.',
    launcher: launch2048
  },
  {
    id: 'reflex',
    title: 'REFLEX MATRIX',
    category: 'Reaksiya & Tezlik',
    icon: '⚡',
    badge: 'MILISEKUND',
    color: 'linear-gradient(135deg, #ffea00, #ff6600)',
    accent: '#ffea00',
    desc: 'Reaksiya tezligingizni sinang. Eng yuqori kombo ko‘paytirgichlariga erishing!',
    launcher: launchReflex
  },
  {
    id: 'spacedodge',
    title: 'SPACE DODGE',
    category: 'Bullet Hell Omon Qolish',
    icon: '🛸',
    badge: 'EKSTREMAL',
    color: 'linear-gradient(135deg, #bd00ff, #ff0055)',
    accent: '#bd00ff',
    desc: 'Kosmik jangovar kemani boshqarib, qizil lazer yomg‘irlaridan qoching.',
    launcher: launchSpaceDodge
  },
  {
    id: 'cyberflappy',
    title: 'CYBER FLAPPY',
    category: 'Arkada Parvoz',
    icon: '🐦',
    badge: 'ENG OG‘IR',
    color: 'linear-gradient(135deg, #00ff88, #00aa55)',
    accent: '#00ff88',
    desc: 'Gravitatsiya qonunlariga qarshi neon ustunlar oralab parvoz qiling.',
    launcher: launchCyberFlappy
  },
  {
    id: 'miner',
    title: 'VOXEL DIGGER',
    category: 'Konchilik & Xazina',
    icon: '⛏️',
    badge: 'CHUQUR KON',
    color: 'linear-gradient(135deg, #ffd700, #00f0ff)',
    accent: '#ffd700',
    desc: 'Yer tubiga chuqur burg‘ilab, olmoslar va qimmatbaho javohirlarni qazib oling.',
    launcher: launchMiner
  },
  {
    id: 'snake',
    title: 'NEON RETRO SNAKE',
    category: 'Retro Arkada',
    icon: '🐍',
    badge: 'SEVIMLI',
    color: 'linear-gradient(135deg, #00ffcc, #0077ff)',
    accent: '#00ffcc',
    desc: 'Klassik ilon o‘yini yangilangan neon grafika va turbo tezlikda.',
    launcher: launchSnake
  }
];
