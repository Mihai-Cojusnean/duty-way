import { computed, inject, Injectable, signal } from '@angular/core';
import * as XLSX from 'xlsx';
import { TelegramService } from '../../../core/telegram.service';
import {
  CatalogMap,
  PerfumeSale,
  ScheduleDiff,
  ScheduleRecord,
} from '../interfaces/duty.interface';
import { UserService } from '../../../services/user.service';
import { User } from '../interfaces/user.interface';
import { ApiService, AppRole } from '../../../core/api.service';
import { SalesHistoryEntry, SalesService } from '../../../core/sales.service';
import { AdminService, AdminUser } from '../../../core/admin.service';

const INITIAL_CATALOG: CatalogMap = {
  BVLGARI: [
    {
      id: 'tygar',
      name: 'Tygar',
      prices: [
        {
          id: '125ml',
          label: '125 ml',
          amountCents: 32400,
          currency: 'EUR',
        },
        {
          id: '60ml',
          label: '60 ml',
          amountCents: 22900,
          currency: 'EUR',
        },
      ],
      creator: 'Jacques Cavallier',
      collection: 'Le Gemme',
      description:
        "Inspiré par la pierre d'œil de tigre, Tygar est une explosion de pamplemousse étincelant mariée à un accord d'ambroxan profond et boisé.",
      notes: 'Grapefruit, Ambroxan, Woody Notes',
      longevity: '9h',
      sillage: 'Strong',
      imageUrl: 'https://i8.amplience.net/i/manor/10003063924_05',
      pros: [
        'Ouverture de pamplemousse extrêmement juteuse et naturelle',
        "Sillage d'ambroxan moderne et envoûtant",
        "Parfait pour les journées ensoleillées et l'été",
      ],
    },
    {
      id: 'tygar_extrait',
      name: 'Tygar Extrait',
      prices: [
        {
          id: '125ml',
          label: '125 ml',
          amountCents: 42100,
          currency: 'EUR',
        },
        {
          id: '60ml',
          label: '60 ml',
          amountCents: 31500,
          currency: 'EUR',
        },
      ],
      creator: 'Jacques Cavallier',
      collection: 'Le Gemme',
      description:
        'Une déclinaison olfactive hautement concentrée de Le Gemme Tygar. Élaboré autour d’accords de pamplemousse intense et d’ambre gris exceptionnel, il magnifie les notes boisées et hespéridées avec une profondeur et une sensualité raffinées.',
      notes: 'Grapefruit, Ambergris, Amber, Citruses, Peru Balsam',
      longevity: '12h',
      sillage: 'Enormous',
      imageUrl: 'https://fimgs.net/himg/o.DXPPaVxpeWO.png',
      pros: [
        'Profondeur accrue avec un ambre gris luxueux',
        'Performance et tenue hors du commun',
        'Caractère extrêmement riche et sophistiqué',
      ],
    },
    // {
    //   id: 'amunae',
    //   name: 'Amunae',
    //   price: '125ml - 324€',
    //   creator: 'Sophie Labbé',
    //   collection: 'Le Gemme',
    //   description:
    //     "Inspiré par la turquoise d'Iran, Amunae associe la fraîcheur d'un accord floral délicat à des notes boisées et musquées équilibrées.",
    //   notes: 'Jasmine, Musk, Oak, Olibanum',
    //   longevity: '7h',
    //   sillage: 'Strong',
    //   imageUrl: 'https://fimgs.net/himg/o.A9xHVWihKSF.jpg',
    //   pros: [
    //     'Harmonie parfaite entre fraîcheur et sensualité',
    //     'Fleurs blanches élégantes et aériennes',
    //     'Sillage propre et très raffiné',
    //   ],
    // },
    // {
    //   id: 'sahare',
    //   name: 'Sahare',
    //   price: '125ml - 324€',
    //   creator: 'Yann Vasnier',
    //   collection: 'Le Gemme',
    //   description:
    //     'Un voyage au cœur du Sahara, où le jaspe rose impérial et la mythique rose de Taïf ' +
    //     's’unissent pour révéler une beauté rare, née de la force des éléments et éclairée par l’espoir de l’aube.',
    //   notes: 'Taif Rose, Ambergris, Lemon, Myrrh, Pepper, Bergamot',
    //   longevity: '9h',
    //   sillage: 'Enormous',
    //   imageUrl:
    //     'https://static.galerieslafayette.com/media/images/hp_mod_114/hp_mod_114353649/sku_sr_114353651/202406250834/eau_de_parfumvaporisateur060_ml-4.jpg',
    //   pros: [
    //     'Projection et sillage puissants',
    //     'Profil olfactif complexe et évolutif',
    //     'Accord de rose de Taïf de haute qualité',
    //   ],
    // },
    // {
    //   id: 'kobraa',
    //   name: 'Kobraa',
    //   price: '125ml - 324€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Le Gemme',
    //   description:
    //     'Inspiré par le jaspe vert snake de Nouvelle-Zélande, Kobraa est un parfum boisé oriental ' +
    //     'mariant un géranium épicé à un encens vert fumé.',
    //   notes: 'Olibanum, Geranium, Oud',
    //   longevity: '8h',
    //   sillage: 'Strong',
    //   imageUrl:
    //     'https://www.verso.com/cdn/shop/files/le-gemme-kobraa-eau-de-parfum-bvlgari-parfums-verso-3.jpg?v=1778227289&width=1080',
    //   pros: [
    //     "Combinaison originale de géranium et d'encens",
    //     'Profil épicé et aromatique très distingué',
    //     'Excellente présence en soirée',
    //   ],
    // },
    // {
    //   id: 'onekh',
    //   name: 'Onekh',
    //   price: '125ml - 324€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Le Gemme',
    //   description:
    //     "Inspiré par l'onyx noir d'Arabie, Onekh exprime la puissance du cuir noir et du laudanum sous une facette riche et fumée d'oud.",
    //   notes: 'Spice Notes, Leather, Labdanum, Agarwood (Oud)',
    //   longevity: '8h',
    //   sillage: 'Strong',
    //   imageUrl:
    //     'https://static.galerieslafayette.com/media/images/hp_mod_114/hp_mod_114353857/sku_sr_114353901/202507021317/eau_de_parfumvaporisateur060_ml-2.jpg',
    //   pros: [
    //     "Accord de cuir fumé d'une immense qualité",
    //     'Sillage sombre, mystérieux et dominant',
    //     'Tenue exceptionnelle sur peau et vêtements',
    //   ],
    // },
    // {
    //   id: 'azaran',
    //   name: 'Azaran',
    //   price: '125ml - 324€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Le Gemme',
    //   description:
    //     "Inspiré par l'énergie enflammée de l'aventurine rouge et des Oural, Azaran est un parfum " +
    //     "cuivré et boisé chaleureux, mêlant une infusion de safran cuiré à l'essence charismatique " +
    //     'du bois de cèdre de Virginie.',
    //   notes: 'Saffron, Bergamot, Red Cedarwood, Leather, Beeswax, Tea',
    //   longevity: '8h',
    //   sillage: 'Strong',
    //   imageUrl:
    //     'https://www.verso.com/cdn/shop/files/le-gemme-azaran-eau-de-parfum-bvlgari-parfums-verso-3.jpg?v=1778227529&width=1080',
    //   pros: [
    //     "Safran épicé et chaleureux d'une grande noblesse",
    //     'Cèdre rouge et cuir magnifiquement fondus',
    //     'Signature olfactive unique',
    //   ],
    // },
    // {
    //   id: 'gyan',
    //   name: 'Gyan',
    //   price: '125ml - 324€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Le Gemme',
    //   description:
    //     'Inspiré par le saphir bleu du Cachemire, Gyan associe la noblesse du jasmin Sambac à un ' +
    //     "patchouli d'Indonésie d'une élégance absolue.",
    //   notes: 'Jasmine, Indonesian Patchouli, Incense',
    //   longevity: '7h',
    //   sillage: 'Strong',
    //   imageUrl:
    //     'https://static.galerieslafayette.com/media/images/hp_mod_114/hp_mod_114353720/sku_sr_114353721/202406250834/eau_de_parfumvaporisateur060_ml-2.jpg',
    //   pros: [
    //     "Patchouli d'une grande pureté sans facette terreuse",
    //     'Jasmin velouté et nocturne',
    //     'Profil floral masculin unique et de haute qualité',
    //   ],
    // },
    // {
    //   id: 'yasep',
    //   name: 'Yasep',
    //   price: '125ml - 324€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Le Gemme',
    //   description:
    //     'Inspiré par le jaspe rouge de Madagascar, Yasep célèbre la chaleur du musc rouge combiné ' +
    //     'au bois de santal et aux poivres épicés.',
    //   notes: 'Sichuan Pepper, Mandarin Orange, Sandalwood, Musk, Cedarwood',
    //   longevity: '7h',
    //   sillage: 'Strong',
    //   imageUrl:
    //     'https://static.galerieslafayette.com/media/images/hp_mod_114/hp_mod_114353921/sku_sr_114353922/202507021317/eau_de_parfumvaporisateur125_ml-2.jpg',
    //   pros: [
    //     'Musc chaud et légèrement épicé',
    //     'Santal crémeux et réconfortant',
    //     'Texture olfactive très douce',
    //   ],
    // },
    // {
    //   id: 'orom',
    //   name: 'Orom',
    //   price: '125ml - 324€\u2003|\u200360ml - 229€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Le Gemme',
    //   description:
    //     'Inspiré par la labradorite de Madagascar, Orom est un parfum ambré boisé axé sur une ' +
    //     "vanille bourbon intense et un bois d'oud d'Assam précieux.",
    //   notes: 'Bourbon Vanilla, Assam Oud, Benzoin',
    //   longevity: '8h',
    //   sillage: 'Strong',
    //   imageUrl:
    //     'https://static.galerieslafayette.com/media/images/hp_mod_114/hp_mod_114354053/sku_sr_114354055/202507021317/eau_de_parfumvaporisateur060_ml-3.jpg',
    //   pros: [
    //     'Vanille bourbon riche et boisée',
    //     "Accord oud d'Assam chaleureux",
    //     'Profil extrêmement gourmand et addictif',
    //   ],
    // },
    // {
    //   id: 'falkar',
    //   name: 'Falkar',
    //   price: '125ml - 324€\u2003|\u200360ml - 229€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Le Gemme',
    //   description:
    //     "Inspiré par l'œil de faucon du Brésil, Falkar exprime la puissance de la forêt profonde à " +
    //     "travers un mélange opulent de cuir, d'oud et de safran.",
    //   notes: 'Nutmeg, Saffron, Cypriol, Leather, Oud, Black Musk',
    //   longevity: '9h',
    //   sillage: 'Enormous',
    //   imageUrl: 'https://cdn.media.amplience.net/i/frasersdev/88778369_o_a2.jpg?v=20241210160056',
    //   pros: [
    //     'Épices chaudes et cuir ténébreux',
    //     'Sillage boisé puissant et mystérieux',
    //     'Sensation de luxe oriental affirmé',
    //   ],
    // },
    // {
    //   id: 'baciami',
    //   name: 'Baciami',
    //   price: '100ml - 260€\u2003|\u200350ml - 180€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Allegra',
    //   description:
    //     'Un élixir ambré floral envoûtant célébrant la passion italienne à travers un gardenia hypnotique et une vanille chaleureuse.',
    //   notes: 'Gardenia, Vanilla, Amber',
    //   longevity: '8h',
    //   sillage: 'Strong',
    //   imageUrl: 'https://fimgs.net/mdimg/perfume/375x500.71887.jpg',
    //   pros: [
    //     'Vanille crémeuse et gourmande',
    //     'Flacon au design bonbon élégant',
    //     'Tenue excellente',
    //   ],
    // },
    // {
    //   id: 'riva_solare',
    //   name: 'Riva Solare',
    //   price: '100ml - 260€\u2003|\u200350ml - 180€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Allegra',
    //   description:
    //     "Capture l'esprit des vacances infinies sur la Riviera italienne avec des agrumes étincelants et une fleur d'oranger solaire.",
    //   notes: 'Bergamot, Neroli, Orange Blossom, Osmanthus, Musk',
    //   longevity: '6h',
    //   sillage: 'Moderate',
    //   imageUrl: 'https://fimgs.net/mdimg/perfume/375x500.64810.jpg',
    //   pros: ['Sensation de soleil et de mer', 'Agrumes lumineux', 'Très rafraîchissant'],
    // },
    // {
    //   id: 'fiori_damore',
    //   name: "Fiori d'Amore",
    //   price: '100ml - 260€\u2003|\u200350ml - 180€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Allegra',
    //   description:
    //     'Un bouquet passionné de roses rouges sublimé par une touche sucrée de framboise sauvage.',
    //   notes: 'Turkish Rose, Bulgarian Rose, Raspberry',
    //   longevity: '7h',
    //   sillage: 'Moderate',
    //   imageUrl: 'https://fimgs.net/mdimg/perfume/375x500.64811.jpg',
    //   pros: ['Rose fraîche et veloutée', 'Touche fruitée de framboise', 'Romantique et féminin'],
    // },
    // {
    //   id: 'man_in_black_edp',
    //   name: 'Bvlgari Man In Black',
    //   price: '100ml - 145€\u2003|\u200360ml - 105€',
    //   creator: 'Alberto Morillas',
    //   collection: 'Bvlgari Man',
    //   description:
    //     'Une Eau de Parfum ambrée néo-orientale au caractère audacieux, avec des notes de rhum épicé, de cuir et de fève tonka.',
    //   notes: 'Spices, Rum, Tobacco, Leather, Iris, Tonka Bean',
    //   longevity: '8h',
    //   sillage: 'Strong',
    //   imageUrl: 'https://fimgs.net/mdimg/perfume/375x500.26358.jpg',
    //   pros: [
    //     'Accord rhum et épices séduisant',
    //     "Parfait pour l'hiver",
    //     'Sillage chaleureux et mystérieux',
    //   ],
    // },
    // {
    //   id: 'man_wood_essence_edp',
    //   name: 'Bvlgari Man Wood Essence',
    //   price: '100ml - 138€\u2003|\u200360ml - 98€',
    //   creator: 'Alberto Morillas',
    //   collection: 'Bvlgari Man',
    //   description:
    //     'Une alliance entre la nature urbaine et le bois, associant agrumes italiens, cèdre et vétiver.',
    //   notes: 'Citruses, Lemon Zest, Cedar, Vetiver, Cypress',
    //   longevity: '7h',
    //   sillage: 'Moderate',
    //   imageUrl: 'https://fimgs.net/mdimg/perfume/375x500.51229.jpg',
    //   pros: ['Boisé vert et dynamique', 'Très polyvalent', "Bonne fraîcheur d'ouverture"],
    // },
    // {
    //   id: 'man_rain_essence',
    //   name: 'Bvlgari Man Rain Essence',
    //   price: '100ml - 138€\u2003|\u200360ml - 98€',
    //   creator: 'Alberto Morillas',
    //   collection: 'Bvlgari Man',
    //   description:
    //     'Un parfum musqué boisé frais célébrant la force régénérante et réparatrice de la pluie.',
    //   notes: 'Green Tea, Orange, White Lotus, Musk, Amber, Guaiac Wood',
    //   longevity: '6h',
    //   sillage: 'Moderate',
    //   imageUrl: 'https://fimgs.net/mdimg/perfume/375x500.79374.jpg',
    //   pros: [
    //     'Fraîcheur aquatique et propre',
    //     'Note de thé apaisante',
    //     'Très agréable au printemps',
    //   ],
    // },
    // {
    //   id: 'crystalline_edt',
    //   name: 'Omnia Crystalline',
    //   price: '100ml - 135€\u2003|\u200350ml - 98€',
    //   creator: 'Alberto Morillas',
    //   collection: 'Omnia',
    //   description:
    //     'Inspiré par la clarté du cristal, évoquant la transparence du lotus, du bambou et du bois de balsa.',
    //   notes: 'Bamboo, Nashi Pear, Lotus, Tea, Guaiac Wood, Musk',
    //   longevity: '6h',
    //   sillage: 'Moderate',
    //   imageUrl: 'https://fimgs.net/mdimg/perfume/375x500.152.jpg',
    //   pros: ['Fraîcheur délicate et aquatique', 'Propre et intemporel', 'Idéal pour le quotidien'],
    // },
    // {
    //   id: 'amethyste_edt',
    //   name: 'Omnia Amethyste',
    //   price: '100ml - 135€\u2003|\u200350ml - 98€',
    //   creator: 'Alberto Morillas',
    //   collection: 'Omnia',
    //   description:
    //     "Inspiré par les nuances nobles de l'améthyste, un bouquet poudré d'iris et de rose arrosé de rosée du matin.",
    //   notes: 'Green Sap, Pink Grapefruit, Iris, Bulgarian Rose, Heliotrope',
    //   longevity: '6h',
    //   sillage: 'Moderate',
    //   imageUrl: 'https://fimgs.net/mdimg/perfume/375x500.153.jpg',
    //   pros: ['Iris poudré très élégant', 'Douceur florale raffinée', 'Flacon bijoux emblématique'],
    // },
    // {
    //   id: 'goldea_edp',
    //   name: 'Rose Goldea',
    //   price: '90ml - 145€\u2003|\u200350ml - 105€',
    //   creator: 'Alberto Morillas',
    //   collection: 'Goldea',
    //   description:
    //     'Un hommage à la féminité et à la séduction, mariant la rose royale au musc blanc envoûtant.',
    //   notes: 'Rose, Pomegranate, Musk, Damask Rose, Jasmine, Peony, Peach',
    //   longevity: '7h',
    //   sillage: 'Moderate',
    //   imageUrl: 'https://fimgs.net/mdimg/perfume/375x500.39862.jpg',
    //   pros: [
    //     'Rose musquée très romantique',
    //     'Note de grenade fruitée',
    //     'Sillage doux et séduisant',
    //   ],
    // },
    // {
    //   id: 'the_vert',
    //   name: 'Eau Parfumée au Thé Vert',
    //   price: '75ml - 105€',
    //   creator: 'Jean-Claude Ellena',
    //   collection: 'Eau Parfumée',
    //   description:
    //     'Création pionnière de 1992 célébrant le thé vert japonais dans un équilibre vitalisant de fraîcheur et de sérénité.',
    //   notes: 'Green Tea, Bergamot, Cardamom, Jasmine, Cedar, Beeswax',
    //   longevity: '5h',
    //   sillage: 'Intimate',
    //   imageUrl: 'https://fimgs.net/mdimg/perfume/375x500.144.jpg',
    //   pros: ["Chef-d'œuvre apaisant", 'Accord de thé vert pionnier', 'Parfait pour se détendre'],
    // },
    // {
    //   id: 'the_blanc',
    //   name: 'Eau Parfumée au Thé Blanc',
    //   price: '75ml - 105€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Eau Parfumée',
    //   description:
    //     "Un élixir réconfortant et doux inspiré par le thé blanc rare de l'Himalaya, avec des nuances d'armoise et de musc.",
    //   notes: 'Tea, Artemisia, Bergamot, Pepper, Cardamom, Amber, Musk',
    //   longevity: '6h',
    //   sillage: 'Intimate',
    //   imageUrl: 'https://fimgs.net/mdimg/perfume/375x500.145.jpg',
    //   pros: [
    //     'Extrêmement doux et réconfortant',
    //     'Profil boisé-musqué délicat',
    //     'Propreté luxueuse',
    //   ],
    // },
    // {
    //   id: 'bvlgari_pour_homme',
    //   name: 'Bvlgari Pour Homme',
    //   price: '100ml - 125€\u2003|\u200350ml - 90€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Pour Homme',
    //   description:
    //     "Un classique floral boisé musqué axé autour de l'accord emblématique de thé Darjeeling et de musc.",
    //   notes: 'Darjeeling Tea, Aldehydes, Bergamot, Lavender, Musk, Cedar',
    //   longevity: '6h',
    //   sillage: 'Moderate',
    //   imageUrl: 'https://fimgs.net/mdimg/perfume/375x500.143.jpg',
    //   pros: ['Thé Darjeeling raffiné', 'Sensation fraîche et propre', 'Intemporel'],
    // },
    // {
    //   id: 'aqva_pour_homme',
    //   name: 'Aqva Pour Homme',
    //   price: '100ml - 125€\u2003|\u200350ml - 90€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Aqva',
    //   description:
    //     "Un parfum aquatique aromatique évoquant la profondeur et la puissance de la mer grâce à l'algue Posidonia.",
    //   notes: 'Mandarin, Santolina, Posidonia Seaweed, Mineral Amber, Clary Sage',
    //   longevity: '7h',
    //   sillage: 'Moderate',
    //   imageUrl: 'https://fimgs.net/mdimg/perfume/375x500.155.jpg',
    //   pros: [
    //     'Note marine et iodée réaliste',
    //     'Masculinité sombre et aquatique',
    //     'Design galet emblématique',
    //   ],
    // },

    // {
    //   id: 'tygar-extrait',
    //   name: 'Tygar Extrait',
    //   price: '125ml - 421€\u2003|\u200360ml - 315€',
    //   creator: 'Jacques Cavallier',
    //   collection: 'Le gemme',
    //   description:
    //     'Un voyage nocturne dans l’État de Kerala, surnommé « le jardin d’épices de l’Inde ». ' +
    //     'Une déclinaison olfactive hautement concentrée de Le Gemme Tygar Eau de Parfum. ' +
    //     'Élaboré autour d’accords de pamplemousse intense et d’ambre gris exceptionnel, il ' +
    //     'magnifie les notes boisées et hespéridées intenses avec une profondeur et une ' +
    //     'sensualité raffinées',
    //   notes: 'Grapefruit, Ambergris, Amber, Citruses, Peru balsam',
    //   longevity: '7h',
    //   sillage: 'Strong',
    //   imageUrl: 'https://fimgs.net/himg/o.DXPPaVxpeWO.png',
    //   pros: [
    //     'Parfum estival luxueux',
    //     'Les notes d’agrumes et de bois se marient à merveille',
    //     'Ouverture réaliste et juteuse de pamplemousse',
    //     'Profil d’ambroxan doux et de haute qualité',
    //     'Caractère élégant, masculin et sophistiqué',
    //     'Composition harmonieuse et mémorable',
    //     'Sillage puissant pour un parfum frais',
    //   ],
    // },
  ],
};

@Injectable({ providedIn: 'root' })
export class ScheduleStore {
  private readonly telegramService = inject(TelegramService);
  private readonly userService = inject(UserService);
  private readonly apiService = inject(ApiService);
  private readonly salesService = inject(SalesService);
  private readonly adminService = inject(AdminService);

  // State Signals
  readonly username = signal<string>('');
  readonly personName = signal<string>('');
  readonly selectedFile = signal<File | null>(null);
  readonly scheduleRecords = signal<ScheduleRecord[]>([]);
  readonly scheduleDiff = signal<ScheduleDiff | null>(null);
  readonly statusMessage = signal<string>('');
  readonly selectedBrand = signal<string | null>(null);
  readonly soldTodayCount = signal<number>(0);
  readonly todaySalesTotalCents = signal<number>(0);
  readonly catalog = signal<CatalogMap>(INITIAL_CATALOG);
  readonly salesHistory = signal<readonly SalesHistoryEntry[]>([]);
  readonly previousSalesHistory = computed(() => {
    const today = new Date().toISOString().slice(0, 10);

    return this.salesHistory().filter((entry) => entry.date !== today);
  });
  readonly appRole = signal<AppRole | null>(null);
  readonly adminUsers = signal<readonly AdminUser[]>([]);
  readonly viewedAdminUser = signal<AdminUser | null>(null);

  readonly isViewingAdminSchedule = computed(() => this.viewedAdminUser() !== null);

  // Computed Projections
  readonly brandPerfumes = computed(() => {
    const brand = this.selectedBrand();
    return brand ? (this.catalog()[brand] ?? []) : [];
  });

  constructor() {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    this.telegramService.init();

    try {
      const currentUser = await this.apiService.getCurrentUser();
      this.appRole.set(currentUser.role);

      if (currentUser.role === 'admin') {
        this.loadAdminUsers();
      }

      console.log('Current user:', currentUser);

      if (!currentUser.workName) {
        this.username.set('Not assigned');
        this.personName.set('Not assigned');
        this.scheduleRecords.set([]);
        this.statusMessage.set(
          'Your work name has not been assigned yet. Please contact an administrator.',
        );
        return;
      }

      this.username.set(currentUser.workName);
      this.personName.set(currentUser.workName);
      this.loadTodaySales();
      this.loadSalesHistory();

      this.loadShiftsFromDatabase();
    } catch (error) {
      console.error('Failed to initialize secure session', error);

      this.username.set('Guest');
      this.personName.set('Guest');
      this.scheduleRecords.set([]);
      this.statusMessage.set('Please open this app through Telegram to load your schedule.');
    }
  }

  setFile(file: File): void {
    this.selectedFile.set(file);
    this.statusMessage.set('');
  }

  selectBrand(brand: string): void {
    this.selectedBrand.set(brand);
  }

  clearBrand(): void {
    this.selectedBrand.set(null);
  }

  selectAdminSchedule(telegramUserId: string): void {
    if (!telegramUserId) {
      this.showMySchedule();
      return;
    }

    const selectedUser = this.adminUsers().find((user) => user.telegram_user_id === telegramUserId);

    if (!selectedUser) {
      return;
    }

    this.statusMessage.set(`Loading ${selectedUser.work_name}'s schedule...`);

    this.adminService.getUserSchedule(telegramUserId).subscribe({
      next: (response) => {
        const records = response.shifts.map((record) => ({
          ...record,
          isPast: this.checkIsPast(record.dateStr),
          isToday: this.checkIsToday(record.dateStr),
        }));

        this.viewedAdminUser.set(response.user);
        this.scheduleDiff.set(null);
        this.scheduleRecords.set(records);
        this.statusMessage.set(
          records.length
            ? `Viewing ${response.user.work_name}'s schedule`
            : `${response.user.work_name} has no saved schedule.`,
        );
      },
      error: (error: unknown) => {
        console.error('Failed to load admin schedule', error);
        this.statusMessage.set('Could not load this schedule.');
      },
    });
  }

  showMySchedule(): void {
    this.viewedAdminUser.set(null);
    this.scheduleDiff.set(null);
    this.loadShiftsFromDatabase();
  }

  private loadAdminUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.adminUsers.set(users);
      },
      error: (error: unknown) => {
        console.error('Failed to load admin users', error);
      },
    });
  }

  private loadShiftsFromDatabase(): void {
    this.statusMessage.set('Loading schedule from database...');

    this.userService.getUser().subscribe({
      next: (response: User) => {
        console.log('Raw DB Response:', response);

        const rawRecords = response.shifts ?? [];

        if (rawRecords.length > 0) {
          const updatedRecords = rawRecords.map((record) => ({
            ...record,
            isPast: this.checkIsPast(record.dateStr),
            isToday: this.checkIsToday(record.dateStr),
          }));

          // Set the signal to trigger template update
          this.scheduleRecords.set(updatedRecords);
          this.statusMessage.set(`${updatedRecords.length} shifts`);
        } else {
          this.scheduleRecords.set([]);
          this.statusMessage.set('No saved shifts found in database.');
        }
      },
      error: (err) => {
        console.error('Failed to load user shifts from DB:', err);
        this.statusMessage.set('Failed to load shifts from database.');
      },
    });
  }

  async loadSchedule(): Promise<void> {
    const file = this.selectedFile();
    const name = this.personName().trim();

    if (!file || !name) {
      this.statusMessage.set('Enter your name and choose an Excel file first.');
      return;
    }

    const fileData = await file.arrayBuffer();
    const workbook = XLSX.read(fileData, { type: 'array' });
    const targetName = name.toLowerCase();
    const rawRecords: ScheduleRecord[] = [];

    for (const tabName of workbook.SheetNames) {
      const sheet = workbook.Sheets[tabName];
      const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');

      for (let row = Math.max(5, range.s.r); row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const person = this.getCellText(sheet, row, col);

          if (!person || !person.toLowerCase().includes(targetName)) {
            continue;
          }

          const day = this.getCellText(sheet, row, 1);
          const dateStr = this.getCellText(sheet, row, 2);
          const hours = col > 0 ? this.getCellText(sheet, row, col - 1) : '';
          const brand = this.getBrandForColumn(sheet, col);

          const lowerBrand = brand.toLowerCase();
          if (lowerBrand === 'heure pause matin' || lowerBrand === 'heure pause soir') {
            continue;
          }

          rawRecords.push({
            id: `${tabName}-${row}-${col}`,
            tabName,
            brand,
            day,
            dateStr,
            dateNumber: this.extractDayNumber(dateStr),
            startHourMinutes: this.extractStartMinutes(hours),
            hours,
            person,
            isPast: this.checkIsPast(dateStr),
            isToday: this.checkIsToday(dateStr),
          });
        }
      }
    }

    const sorted = rawRecords.sort(
      (a, b) => a.dateNumber - b.dateNumber || a.startHourMinutes - b.startHourMinutes,
    );

    const previousRecords = this.scheduleRecords();

    this.scheduleRecords.set(sorted);
    this.scheduleDiff.set(
      previousRecords.length ? this.compareSchedules(previousRecords, sorted) : null,
    );

    this.statusMessage.set(
      sorted.length ? `${sorted.length} shifts` : `No shifts found for "${name}".`,
    );

    this.saveSchedule(sorted);
  }

  private saveSchedule(sorted: ScheduleRecord[]): void {
    this.userService.saveUser(sorted).subscribe({
      next: (res) => console.log('Successfully saved to KV!'),
      error: (err) => console.error('Error saving:', err),
    });
  }

  private compareSchedules(
    previous: readonly ScheduleRecord[],
    current: readonly ScheduleRecord[],
  ): ScheduleDiff {
    const previousByKey = new Map(previous.map((record) => [this.shiftKey(record), record]));

    const currentByKey = new Map(current.map((record) => [this.shiftKey(record), record]));

    const added = current.filter((record) => !previousByKey.has(this.shiftKey(record)));

    const removed = previous.filter((record) => !currentByKey.has(this.shiftKey(record)));

    const changed = current.flatMap((record) => {
      const oldRecord = previousByKey.get(this.shiftKey(record));

      if (!oldRecord || oldRecord.hours === record.hours) {
        return [];
      }

      return [{ previous: oldRecord, current: record }];
    });

    return { added, removed, changed };
  }

  private shiftKey(record: ScheduleRecord): string {
    return [record.tabName, record.dateStr, record.brand]
      .map((value) => value.trim().toLowerCase())
      .join('|');
  }

  recordSale(sale: PerfumeSale): void {
    const brand = this.selectedBrand();

    if (!brand) {
      return;
    }

    this.salesService.recordSale(brand, sale).subscribe({
      next: (response) => {
        this.soldTodayCount.set(response.summary.count);
        this.todaySalesTotalCents.set(response.summary.totalCents);
      },
      error: (error: unknown) => {
        console.error('Failed to save sale', error);
      },
    });
  }

  private loadTodaySales(): void {
    this.salesService.getTodaySummary().subscribe({
      next: (summary) => {
        this.soldTodayCount.set(summary.count);
        this.todaySalesTotalCents.set(summary.totalCents);
      },
      error: (error: unknown) => {
        console.error('Failed to load today sales', error);
      },
    });
  }

  private loadSalesHistory(): void {
    this.salesService.getRecentHistory(31).subscribe({
      next: (history) => {
        this.salesHistory.set(history);
      },
      error: (error: unknown) => {
        console.error('Failed to load sales history', error);
      },
    });
  }

  private getCellText(sheet: XLSX.WorkSheet, row: number, col: number): string {
    const address = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[address];
    return cell ? XLSX.utils.format_cell(cell).trim() : '';
  }

  private getBrandForColumn(sheet: XLSX.WorkSheet, col: number): string {
    for (let currentCol = col; currentCol >= 0; currentCol--) {
      const brand = this.getCellText(sheet, 4, currentCol);
      if (brand) return brand;
    }
    return 'Unknown Brand';
  }

  private extractDayNumber(dateStr: string): number {
    const match = dateStr.match(/\d+/);
    return match ? Number(match[0]) : 99;
  }

  private extractStartMinutes(hours: string): number {
    const start = hours.split('-')[0]?.trim().toLowerCase() ?? '';
    const timeMatch = start.match(/(\d{1,2})\s*[h:]\s*(\d{1,2})?/);

    if (timeMatch) {
      return Number(timeMatch[1]) * 60 + Number(timeMatch[2] ?? 0);
    }

    const hourMatch = start.match(/\d+/);
    return hourMatch ? Number(hourMatch[0]) * 60 : 9999;
  }

  private checkIsPast(dateStr: string): boolean {
    const shiftDate = new Date(`${dateStr} ${new Date().getFullYear()}`);
    shiftDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !Number.isNaN(shiftDate.getTime()) && shiftDate < today;
  }

  private checkIsToday(dateStr: string): boolean {
    const shiftDate = new Date(`${dateStr} ${new Date().getFullYear()}`);
    shiftDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !Number.isNaN(shiftDate.getTime()) && shiftDate.getTime() === today.getTime();
  }
}
