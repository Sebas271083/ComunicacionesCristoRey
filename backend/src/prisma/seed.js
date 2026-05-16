import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Parse fecha en formato DD/MM/YYYY → Date UTC (devuelve null si es inválida)
function pd(str) {
  if (!str) return null;
  const s = String(str).trim();
  // Corregir formatos pegados tipo "0212/2013" → "02/12/2013"
  const fixed = s.replace(/^(\d{2})(\d{2})\/(\d{4})$/, '$1/$2/$3');
  const m = fixed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m.map(Number);
  if (!d || !mo || mo > 12 || mo === 0 || d > 31) return null;
  return new Date(Date.UTC(y, mo - 1, d));
}

// ─── Datos reales del registro de inscripción 2026 ───────────────────────────
const ALUMNOS_DATA = [
  // ─── 7° Grado ───────────────────────────────────────────────────────────────
  { g: '7° Grado', n: 'Castillo Agüila Lorena',              s: 'M', fn: '07/03/2014', nac: 'Argentina',  dni: '18541598 en trámite',   resp: 'Agüila García Melina José',        dniR: '9492814',   dom: 'Constituyente y la Nueva',               tel: '1188462171'   },
  { g: '7° Grado', n: 'Giménez López Laura Noemi',           s: 'M', fn: '15/04/2014', nac: 'Argentina',  dni: '53741983',              resp: 'Agüila García Melina José',        dniR: '9492814',   dom: 'Quesada 4972',                           tel: '1151031619'   },
  { g: '7° Grado', n: 'García González Maia Daiana',         s: 'M', fn: '02/05/2014', nac: 'Paraguay',   dni: '95502388',              resp: 'Giménez Oliver',                   dniR: '9488725',   dom: 'Ecuador 2860',                           tel: '1131815790'   },
  { g: '7° Grado', n: 'Giménez González Juan Manuel',        s: 'V', fn: '27/08/2014', nac: 'Argentina',  dni: '54190628',              resp: 'González María Aldana',            dniR: '95047520',  dom: 'Azcuaga 3512 1a',                        tel: '1117920007'   },
  { g: '7° Grado', n: 'Ponce Benjamín Maximiliano',          s: 'V', fn: '29/04/2014', nac: 'Argentina',  dni: '53949355',              resp: 'Santos Noelia',                    dniR: '31525228',  dom: 'Perú 1266',                              tel: '1359409897'   },
  { g: '7° Grado', n: 'Duarte Huerta Torres Alexander',      s: 'V', fn: '22/11/2013', nac: 'Argentina',  dni: '53584187',              resp: 'Huerta Judith',                    dniR: '94161173',  dom: 'Bucarest 3439',                          tel: '1133982379'   },
  { g: '7° Grado', n: 'Vásquez González Lucas Sebastian',    s: 'V', fn: '22/03/2014', nac: 'Argentina',  dni: '53874617',              resp: 'Velázquez Nelson',                 dniR: '94743346',  dom: 'Santa Brígida Moreno',                   tel: '1121795811'   },
  { g: '7° Grado', n: 'Zucarelli Juan Cruz',                 s: 'V', fn: '02/12/2013', nac: 'Argentina',  dni: '53293161',              resp: 'Karina',                           dniR: '22098646',  dom: 'Larsen 3096',                            tel: '1121795811'   },
  // ─── 6° Grado ───────────────────────────────────────────────────────────────
  { g: '6° Grado', n: 'Pascuzzo Octavio',                    s: 'V', fn: '23/10/2014', nac: 'Argentina',  dni: '54379552',              resp: 'Amato Yarina',                     dniR: '267353029', dom: 'Libertad 839',                           tel: '1563718851'   },
  { g: '6° Grado', n: 'Punta Benicio',                       s: 'V', fn: '21/05/2015', nac: 'Argentina',  dni: '54816035',              resp: 'Lago Rocio',                       dniR: '34789024',  dom: 'Caamaño 2254',                           tel: '1561145778'   },
  { g: '6° Grado', n: 'Samudio Giovanna',                    s: 'M', fn: '24/02/2015', nac: 'Argentina',  dni: '54704402',              resp: 'Noguera Antonella',                dniR: '36528154',  dom: 'Aizpurua 3047',                          tel: '1136694394'   },
  { g: '6° Grado', n: 'Varela Sebastián Joaquín',            s: 'V', fn: '11/08/2014', nac: 'Argentina',  dni: '54187123',              resp: 'Varela Joaquín René',              dniR: '27693112',  dom: 'Av. Cramer 2865 2 P.B',                  tel: '1567135248'   },
  { g: '6° Grado', n: 'Vella Baltazar',                      s: 'V', fn: '24/04/2015', nac: 'Argentina',  dni: '54789646',              resp: 'Pastorino Sabrina',                dniR: '27861463',  dom: 'Capdevila 2977 7°a',                     tel: '11565012612'  },
  { g: '6° Grado', n: 'Walsh Donato',                        s: 'V', fn: '01/07/2014', nac: 'Argentina',  dni: '54097770',              resp: 'Ruquet María Alfonsina',            dniR: '28772467',  dom: 'Capdevila 3186',                         tel: '1167455553'   },
  { g: '6° Grado', n: 'Yamagusuku Martínez Ryu Alexis',      s: 'V', fn: '02/07/2014', nac: 'Argentina',  dni: '54101289',              resp: 'Martínez',                         dniR: '28772467',  dom: 'Rufino 3111',                            tel: '1131414529'   },
  // ─── 5° Grado ───────────────────────────────────────────────────────────────
  { g: '5° Grado', n: 'Alliot Celsi Leonardo Vittorio',      s: 'V', fn: '29/01/2016', nac: 'Argentina',  dni: '55393796',              resp: 'Celsi María Belén',                dniR: '35107853',  dom: 'Lebreton 5137 Villa Urquiza',            tel: '1557556527'   },
  { g: '5° Grado', n: 'Bourgeon Gomez Juliette',             s: 'M', fn: '14/05/2015', nac: 'Venezuela',  dni: 'Pasaporte: 186092954',  resp: 'Odily Carolina Gomez Vasquez',    dniR: null,        dom: 'Iberá 5225 Villa Urquiza',               tel: '1162667460'   },
  { g: '5° Grado', n: 'Echeverría Vera Gustavo Joel',        s: 'V', fn: '25/03/2016', nac: 'Argentina',  dni: '55391697',              resp: 'Vera Benítez Inocencia',           dniR: '38371060',  dom: 'S/calle s/nro mz30 casa0 villa 15 villa lugano', tel: '1138164037' },
  { g: '5° Grado', n: 'Fang Iris Tiziana',                   s: 'M', fn: '22/03/2016', nac: 'Argentina',  dni: '55478159',              resp: 'Cheng Liping',                     dniR: '94497354',  dom: 'Av. Triunvirato 5742',                   tel: '1133821392'   },
  { g: '5° Grado', n: 'Fang Mijael Timoteo',                 s: 'V', fn: '09/04/2015', nac: 'Argentina',  dni: '54699765',              resp: 'Cheng Liping',                     dniR: '94497354',  dom: 'Av. Triunvirato 5742',                   tel: '1133821392'   },
  { g: '5° Grado', n: 'Lescano Lourdes Pilar',               s: 'M', fn: '06/09/2015', nac: 'Argentina',  dni: '54970185',              resp: 'Lescano Rodríguez Nicolás',        dniR: '33187280',  dom: 'Venezuela 125',                          tel: '1128311333'   },
  { g: '5° Grado', n: 'Lovera Portal Guadalupe',             s: 'M', fn: '23/08/2015', nac: 'Argentina',  dni: '54913943',              resp: 'Portal Celsa',                     dniR: '94810723',  dom: 'La Nueva 1031',                          tel: '1524486266'   },
  { g: '5° Grado', n: 'Luque Camilo Valentín',               s: 'V', fn: '09/09/2015', nac: 'Argentina',  dni: '54968900',              resp: 'Godoy Aldana',                     dniR: '36741786',  dom: 'Pastor Obligado 2134',                   tel: '1124669713'   },
  { g: '5° Grado', n: 'Mattioni Bordoni Julieta',            s: 'M', fn: '15/11/2015', nac: 'Argentina',  dni: '55167707',              resp: 'Bordoni Eva',                      dniR: '23303490',  dom: 'Pacheco 3330',                           tel: '1549480257'   },
  { g: '5° Grado', n: 'Paricahua De la Cruz Gia Aliss Lucia',s: 'M', fn: '22/04/2015', nac: 'Perú',       dni: '96261310',              resp: 'De la Cruz María Janete',          dniR: '95836635',  dom: 'Villegas 2782',                          tel: '1133349974'   },
  { g: '5° Grado', n: 'Rodríguez Abigail Aylen',             s: 'M', fn: '09/01/2016', nac: 'Argentina',  dni: '55297197',              resp: 'Ferreira Gisella',                 dniR: '34358533',  dom: 'Domingo Sacarlatti 6414 b',              tel: '1134455878'   },
  { g: '5° Grado', n: 'Suslova Elizaveta',                   s: 'M', fn: '15/01/2016', nac: 'Rusia',      dni: '96414579',              resp: 'Anastasia Suslova',                dniR: '96415873',  dom: 'Quesada 5237',                           tel: '1176319034'   },
  { g: '5° Grado', n: 'Torrez Becerra Sebastián David',      s: 'V', fn: '28/03/2016', nac: 'Venezuela',  dni: '95870916',              resp: 'Becerra Wendy',                    dniR: '95696311',  dom: 'Av. Triunvirato 1 p c',                  tel: '1122662096'   },
  { g: '5° Grado', n: 'Velázquez González Belén',            s: 'M', fn: '20/06/2016', nac: 'Argentina',  dni: '55731669',              resp: 'Gonzales María Victoria',          dniR: '94464806',  dom: 'Pedro de Mendoza 25',                    tel: '1551131684'   },
  { g: '5° Grado', n: 'Zancai Federico',                     s: 'V', fn: '07/11/2014', nac: 'Argentina',  dni: '54385837',              resp: 'Reynoso Fernanda',                 dniR: '24591211',  dom: 'Zufriategui 3840',                       tel: '1559662218'   },
  // ─── 4° Grado ───────────────────────────────────────────────────────────────
  { g: '4° Grado', n: 'Casanova Mansilla Franchesca',        s: 'M', fn: '09/08/2016', nac: 'Argentina',  dni: '55748416',              resp: 'Mansilla María Sol',               dniR: '38351911',  dom: 'Moldes 3186',                            tel: '2236515950'   },
  { g: '4° Grado', n: 'Chen Rongxuan',                       s: 'V', fn: '28/04/2016', nac: 'China',      dni: 'en trámite',            resp: 'Quanfa Chen',                      dniR: '94032400',  dom: 'Triunvirato 5439',                       tel: '1523068433'   },
  { g: '4° Grado', n: 'Conrad Ivan',                         s: 'V', fn: '29/11/2016', nac: 'Argentina',  dni: '55994377',              resp: 'Bello Mariel',                     dniR: '23328422',  dom: 'Bucarelli 2996',                         tel: '1151585890'   },
  { g: '4° Grado', n: 'Fernandez Emma Sofía',                s: 'M', fn: '08/03/2017', nac: 'Argentina',  dni: '56120498',              resp: 'Rocio',                            dniR: '42836289',  dom: 'Carlos Melo 5299',                       tel: '1128186823'   },
  { g: '4° Grado', n: 'Ferrer Medina Victoria',              s: 'M', fn: '14/03/2017', nac: 'Argentina',  dni: '56176785',              resp: 'Medina Gabriela',                  dniR: '28695807',  dom: 'Valdenegro 2750 1°5',                    tel: '1550430441'   },
  { g: '4° Grado', n: 'Garay Adrián Martina',                s: 'M', fn: '15/06/2017', nac: 'Argentina',  dni: '55889065',              resp: 'Santander',                        dniR: '93305491',  dom: '4 de febrero s.m. monob 4',              tel: '45089024'     },
  { g: '4° Grado', n: 'Garcete López Nahiara',               s: 'M', fn: '11/06/2017', nac: 'Argentina',  dni: '56490327',              resp: 'Garay Viera Edith',                dniR: '95250721',  dom: 'Ecuador 2860',                           tel: '1168161598'   },
  { g: '4° Grado', n: 'Kuiko Ramírez Joaquín Andrés',        s: 'V', fn: '15/06/2017', nac: 'Argentina',  dni: '56387617',              resp: 'Florencia',                        dniR: '33058351',  dom: 'Iberá 5653',                             tel: '1533501418'   },
  { g: '4° Grado', n: 'Revilla Ramírez Lucas Thomas',        s: 'V', fn: '17/09/2016', nac: 'Venezuela',  dni: '96312465',              resp: 'Ramírez Douglanys',                dniR: 'en trámite',dom: 'Nahuel Huappl 4774',                     tel: '1170803248'   },
  { g: '4° Grado', n: 'Ríos Valentín Tomás',                 s: 'V', fn: '18/04/2017', nac: 'Argentina',  dni: '56117765',              resp: 'Reyes Cristian',                   dniR: '37823020',  dom: 'Bolivia 6074 3 p J',                     tel: '1157695984'   },
  { g: '4° Grado', n: 'Romanelli Lautaro',                   s: 'V', fn: '14/03/2017', nac: 'Argentina',  dni: '56392165',              resp: 'Tosto Georgina',                   dniR: '27310699',  dom: 'Las Heras 1134 (San Martín)',             tel: '1136297414'   },
  { g: '4° Grado', n: 'Vazquez Liam Benicio',                s: 'V', fn: '29/10/2016', nac: 'Argentina',  dni: '55816387',              resp: 'Paez María Rosana',                dniR: '28638614',  dom: 'Guemes 5211 V. Lopez',                   tel: '1523415903'   },
  { g: '4° Grado', n: 'Walsh Timoteo',                       s: 'V', fn: '15/07/2016', nac: 'Argentina',  dni: '55692567',              resp: 'Ruquet María Alfonsina',            dniR: '29446418',  dom: 'Capdevila 3186',                         tel: '1167455553'   },
  // ─── 3° Grado ───────────────────────────────────────────────────────────────
  { g: '3° Grado', n: 'Cárdenas Gina',                       s: null, fn: '24/04/2018', nac: 'Argentina', dni: '56993877',              resp: 'Cárdenas Martin',                  dniR: '36528716',  dom: 'Condarco 4932',                          tel: '1131994985'   },
  { g: '3° Grado', n: 'Cuba Mundaraí Carlos Lionel',          s: 'V', fn: '27/05/2018', nac: 'Venezuela', dni: '96070415',              resp: 'Mundaraí Carrasquero Alianna',     dniR: '96067993',  dom: 'Gral Mariano Acha 1474',                 tel: '1138986705'   },
  { g: '3° Grado', n: 'Lazcano Sirolli Mateo Uriel',          s: 'V', fn: '21/02/2018', nac: 'Argentina', dni: '56816572',              resp: 'Melina D. Sirolli',                dniR: '31013240',  dom: 'Bertolotu 3367',                         tel: '31013240'     },
  { g: '3° Grado', n: 'Ling Rouchu',                          s: 'V', fn: '10/08/2017', nac: 'China',     dni: 'EJ9905456',             resp: 'Lin Binobin',                      dniR: '95343270',  dom: 'Tucumán 1431',                           tel: '1176839999'   },
  { g: '3° Grado', n: 'Nonega María Constanza',               s: 'M', fn: '18/12/2017', nac: 'Argentina', dni: '56809707',              resp: 'Mercedes',                         dniR: '37969006',  dom: 'Berthelot 3505',                         tel: '1138262765'   },
  { g: '3° Grado', n: 'Peduto Marin Lucas Bastian',           s: 'V', fn: '12/04/2018', nac: 'Argentina', dni: '56790972',              resp: 'Marin Nadia',                      dniR: '35561518',  dom: 'Los Olivos 7486',                        tel: '1128973677'   },
  { g: '3° Grado', n: 'Sosa Sanchez Emily Valentina',         s: 'M', fn: '08/11/2017', nac: 'Argentina', dni: '56476164',              resp: 'Sosa Mario',                       dniR: '94726878',  dom: 'Calle B 8373 L Suárez',                  tel: '1168549138'   },
  { g: '3° Grado', n: 'Taborda Lucas Miguel',                 s: 'V', fn: '12/01/2018', nac: 'Argentina', dni: '56710443',              resp: 'Taborda Bárbara',                  dniR: '95547438',  dom: 'Colodrero 3110',                         tel: '1168618092'   },
  { g: '3° Grado', n: 'Vazquez Da Corte Ethan Alejandro',     s: 'V', fn: '16/02/2018', nac: 'Argentina', dni: '96043784',              resp: 'Vazquez Da Corte Leticia',         dniR: '95998023',  dom: 'Andonaegui 1499',                        tel: '117361860'    },
  { g: '3° Grado', n: 'Yamagusuku Martínez Camila Sayumi',    s: 'M', fn: '26/10/2017', nac: 'Argentina', dni: '56577552',              resp: 'Martínez Leticia',                 dniR: '23772467',  dom: 'Pasaje Rufino 31 11',                    tel: '1131414529'   },
  // ─── 2° Grado ───────────────────────────────────────────────────────────────
  { g: '2° Grado', n: 'Ignatiev Vera Sasha',                 s: 'M', fn: '25/01/2019', nac: 'Argentina',  dni: '57518139',              resp: 'Figuereso Gabriela',               dniR: '27217085',  dom: 'Quesada 5239',                           tel: '1550242017'   },
  { g: '2° Grado', n: 'Ojeda Bruno Tiziano',                 s: 'V', fn: '02/12/2018', nac: 'Argentina',  dni: '57390055',              resp: 'Del Carmen Elvira',                dniR: '31690577',  dom: 'Pacheco 3494',                           tel: '1130972571'   },
  { g: '2° Grado', n: 'Paez Dante Ignacio',                  s: 'V', fn: '09/04/2019', nac: 'Argentina',  dni: '57585210',              resp: 'Paez Rosana',                      dniR: '28638814',  dom: 'Campos y Constituyentes s/n',            tel: '1133496343'   },
  { g: '2° Grado', n: 'Punta Emilia',                        s: 'M', fn: '24/06/2019', nac: 'Argentina',  dni: '57763819',              resp: 'Lago Rocio',                       dniR: '34789024',  dom: 'Caamaño 2254',                           tel: '1157689762'   },
  { g: '2° Grado', n: 'Ramírez Rugeles Kerman Derek',         s: 'V', fn: '06/03/2018', nac: 'Venezuela',  dni: '192046978',             resp: 'Rugeles Genessis',                 dniR: '192046978', dom: 'Blanco Encalada 4470',                   tel: '1176314873'   },
  { g: '2° Grado', n: 'Valiente Nicolas',                    s: 'V', fn: '01/07/2018', nac: 'Argentina',  dni: '57107628',              resp: 'Valiente Friorella',               dniR: '94030220',  dom: 'Sarmiento 1893 9°2',                     tel: '1173662609'   },
  { g: '2° Grado', n: 'Vella Benicio',                       s: 'V', fn: '18/12/2018', nac: 'Argentina',  dni: '57428832',              resp: 'Pastorino Sabrina',                dniR: '27861463',  dom: 'Capdevila 2977 7°a',                     tel: '1161200116'   },
  // ─── 1° Grado ───────────────────────────────────────────────────────────────
  { g: '1° Grado', n: 'Cárdenas Benjamín',                   s: 'V', fn: '16/11/2019', nac: null,         dni: '58030047',              resp: 'Cárdenas Martín',                  dniR: '36528716',  dom: 'Condarco 4932',                          tel: '1131994985'   },
  { g: '1° Grado', n: 'Cuba Mundaraí Juan Matheo',           s: 'V', fn: '30/04/2020', nac: 'Argentina',  dni: '58375070',              resp: 'Mundaraí Alianna',                 dniR: '96065793',  dom: 'M. Acha 1474 68',                        tel: '1138986705'   },
  { g: '1° Grado', n: 'Cásnem García Milena Isabel',         s: 'M', fn: '28/11/2019', nac: 'Argentina',  dni: '58135143',              resp: 'García Carolina',                  dniR: '41778642',  dom: 'Andonaeguí 3311',                        tel: '1124055601'   },
  { g: '1° Grado', n: 'Leibowell García Milena Isabel',      s: 'M', fn: '28/11/2019', nac: 'Argentina',  dni: '58135143',              resp: 'García Carolina',                  dniR: '41778642',  dom: 'Andonaeguí 3311',                        tel: '1124055601'   },
  { g: '1° Grado', n: 'Lazcano Caballa Claudia',             s: 'M', fn: '19/12/2019', nac: 'Argentina',  dni: '58379151',              resp: 'Caballa Estebina',                 dniR: '94431738',  dom: 'Av. Constituyente 1184',                 tel: '1151111781'   },
  { g: '1° Grado', n: 'López Olivera Sofía',                 s: 'M', fn: '25/03/2020', nac: 'Argentina',  dni: '58485899',              resp: 'Olivera Eliana',                   dniR: '95144482',  dom: 'Oliverria 3312 V. Colina',               tel: '1132372348'   },
  { g: '1° Grado', n: 'Mendoza Gomez Martina Valeria',       s: 'M', fn: '03/06/2020', nac: 'Venezuela',  dni: null,                    resp: 'Gomez Vazquez Odily Carolina',    dniR: 'V-19145512', dom: 'Ecuador 2860',                          tel: '1162667460'   },
  { g: '1° Grado', n: 'Oras Gallegos Catalina Belén',        s: 'M', fn: '25/11/2019', nac: 'Argentina',  dni: '57893979',              resp: 'Gallego Melany',                   dniR: '94912208',  dom: 'San Martín 2154',                        tel: '1138800787'   },
  { g: '1° Grado', n: 'Vargas Acosta Sofía Valentina',       s: 'M', fn: '22/07/2019', nac: 'Argentina',  dni: '57824534',              resp: 'Acosta Clara',                     dniR: '95124737',  dom: 'Quesada 5279 PB1',                       tel: '1134241983'   },
  // ─── Sala 5 ─────────────────────────────────────────────────────────────────
  { g: 'Sala 5',   n: 'García Benítez Ciro Liam',            s: 'V', fn: '01/09/2020', nac: 'Argentina',  dni: '58209674',              resp: 'Benítez Figueredo Cinthia Lliluf', dniR: '94656674',  dom: 'Santa Peña 1953 San Martín',             tel: '11247999945'  },
  { g: 'Sala 5',   n: 'Gérez Giménez Sandro',                s: 'V', fn: '25/10/2020', nac: 'Argentina',  dni: '58569351',              resp: 'Giménez Giuliana',                 dniR: '41210065',  dom: 'Boulogne Sur Mer 2377 (SM)',              tel: '1158940215'   },
  // ─── Sala 4 ─────────────────────────────────────────────────────────────────
  { g: 'Sala 4',   n: 'Rivas Márquez Agustina',              s: 'M', fn: '10/11/2020', nac: 'Argentina',  dni: '58633018',              resp: 'Márquez Cecilia',                  dniR: '95802040',  dom: 'Congreso 5158',                          tel: '1170305861'   },
  { g: 'Sala 4',   n: 'Alfonso Carrion Uriel Mateo',         s: 'V', fn: '13/08/2021', nac: 'Argentina',  dni: '58909316',              resp: 'María Amalia Carrion',             dniR: '32248786',  dom: 'Nuñez 5425',                             tel: '1131822464'   },
  { g: 'Sala 4',   n: 'Guillaume Laudaro Lionel',            s: 'V', fn: '14/01/2022', nac: 'Argentina',  dni: '59127914',              resp: 'Solinge Daiana Barboza',           dniR: '37342088',  dom: 'Galvan 5063',                            tel: '1176313034'   },
  { g: 'Sala 4',   n: 'Sudlov Stepan',                       s: 'V', fn: '18/10/2021', nac: 'Argentina',  dni: '96414682',              resp: 'Anastasia Suslova',                dniR: '96435873',  dom: 'Quesada 5237 / Cristoforo Alvarez 5900', tel: '1165103684'   },
  { g: 'Sala 4',   n: 'Zabaleta Díaz Marina Ayín',           s: 'M', fn: '15/08/2021', nac: 'Argentina',  dni: '59033955',              resp: 'Micaela Díaz',                     dniR: '45686718',  dom: null,                                     tel: '1165109684'   },
  { g: 'Sala 4',   n: 'Zuria Ethan Damián',                  s: 'V', fn: '24/07/2021', nac: 'Argentina',  dni: '58949168',              resp: 'León Julián Yamila',               dniR: '42321182',  dom: 'Av. Triunvirato 5476',                   tel: '1158629038'   },
  // ─── Sala 3 ─────────────────────────────────────────────────────────────────
  { g: 'Sala 3',   n: 'Cabrera Villalba Elías Fernando',     s: 'V', fn: null,          nac: 'Argentina',  dni: '59875477',              resp: 'Villalba Liz Carolina',            dniR: '95548433',  dom: 'Ricardo Rojas y Soler (Morón)',           tel: '1138999975'   },
  { g: 'Sala 3',   n: 'Cásnem María Emilia',                 s: 'M', fn: null,          nac: 'Argentina',  dni: '59493543',              resp: 'Artua María Beatriz',              dniR: '34967021',  dom: 'Andonaeguí 3311',                        tel: '1168681499'   },
  { g: 'Sala 3',   n: 'García Lucio',                        s: 'V', fn: '20/10/2023', nac: null,         dni: '70056964',              resp: 'Coronel María',                    dniR: '33096316',  dom: 'Quesada 5739 28',                        tel: '1160373466'   },
  { g: 'Sala 3',   n: 'Herrera Torres Julián Andrés',        s: 'V', fn: '07/03/2023', nac: 'Argentina',  dni: '58699679',              resp: 'Torres Molina Mayra',              dniR: '99933801',  dom: 'Av. Congreso 5175 1°a',                  tel: '1122538379'   },
  { g: 'Sala 3',   n: 'Jiménez Oliver Mauricio',             s: 'V', fn: '14/05/2023', nac: 'Argentina',  dni: '58806473',              resp: 'Oliver Alvarado Raymary',          dniR: '97772220',  dom: 'Quesada 5457 Pl Dto 4',                  tel: '1161730547'   },
  { g: 'Sala 3',   n: 'Reim Dhalia',                         s: 'M', fn: '14/06/2023', nac: 'Argentina',  dni: '59915928',              resp: 'Cantero Coronel Liz',              dniR: '94138930',  dom: 'Carrasco 2548 (San Justo)',               tel: '1167999964'   },
  { g: 'Sala 3',   n: 'Teruelo Noa',                         s: 'V', fn: '22/02/2023', nac: 'Argentina',  dni: '59650166',              resp: 'Belén Ciripa',                     dniR: '37088215',  dom: 'Berni 5963',                             tel: '1165482210'   },
  // ─── Sala 2 ─────────────────────────────────────────────────────────────────
  { g: 'Sala 2',   n: 'Brio Lucas',                          s: 'V', fn: '25/01/2024', nac: 'Argentina',  dni: '70140934',              resp: 'Giunta María',                     dniR: '95560409',  dom: 'Nuñez 5389',                             tel: '1136035181'   },
  { g: 'Sala 2',   n: 'Cardea Sara',                         s: 'M', fn: '28/01/2024', nac: 'Argentina',  dni: '70141406',              resp: 'Paola Vega',                       dniR: '35185668',  dom: 'Quesada 5031',                           tel: '1568059911'   },
  { g: 'Sala 2',   n: 'Ignatiev Iván Vlad',                  s: 'V', fn: '15/02/2024', nac: 'Argentina',  dni: '70166748',              resp: 'Figuereco M. Gabriela',            dniR: '27217085',  dom: 'Quesada 5239',                           tel: '1550042017'   },
  { g: 'Sala 2',   n: 'Jiménez Sofía Amalie',               s: 'M', fn: '28/06/2024', nac: 'Argentina',  dni: '70255468',              resp: 'Rocío M. Delgado',                 dniR: '40090935',  dom: 'Venezuela 129',                          tel: '1123666875'   },
  { g: 'Sala 2',   n: 'Lazcano Sirolli Enzo',               s: 'V', fn: '16/11/2023', nac: 'Argentina',  dni: '70071883',              resp: 'Melina Sirolli',                   dniR: '31013240',  dom: 'Berthelot 3367',                         tel: '1130167006'   },
  { g: 'Sala 2',   n: 'Oliu Haironian (Enzo)',               s: 'V', fn: '18/01/2024', nac: 'China',      dni: '96459670',              resp: 'Lin Mailing',                      dniR: '95587421',  dom: 'Nuñez 5541',                             tel: '1323333477'   },
  { g: 'Sala 2',   n: 'Ruas Verde Emma Andreína',            s: 'M', fn: '11/04/2024', nac: 'Argentina',  dni: '70207749',              resp: 'Dorta Verde Peña',                 dniR: '96228679',  dom: 'Echeverría 3236',                        tel: '1277344007'   },
];

async function main() {
  console.log('🌱 Iniciando seed...');
  console.log('⚠️  Esto borrará TODOS los datos existentes antes de insertar.');

  await prisma.pushSubscription.deleteMany();
  await prisma.mensaje.deleteMany();
  await prisma.anuncio.deleteMany();
  await prisma.tarea.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.papaAlumno.deleteMany();
  await prisma.alumno.deleteMany();
  await prisma.cursoDocente.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.materia.deleteMany();
  await prisma.usuario.deleteMany();

  const hash = (p) => bcrypt.hash(p, 12);

  // ── Usuarios de demo/sistema ──────────────────────────────────────────────
  const [docente1, docente2, docente3, papa1, papa2, admin, director, secretaria] = await Promise.all([
    prisma.usuario.create({ data: { email: 'ana@escuela.com',          password: await hash('123456'),        nombre: 'Prof. Ana García',      rol: 'docente'    } }),
    prisma.usuario.create({ data: { email: 'carlos@escuela.com',       password: await hash('123456'),        nombre: 'Prof. Carlos López',    rol: 'docente'    } }),
    prisma.usuario.create({ data: { email: 'maria@escuela.com',        password: await hash('123456'),        nombre: 'Prof. María Fernández', rol: 'docente'    } }),
    prisma.usuario.create({ data: { email: 'juan@gmail.com',           password: await hash('123456'),        nombre: 'Juan Martínez',         rol: 'papa'       } }),
    prisma.usuario.create({ data: { email: 'laura@gmail.com',          password: await hash('123456'),        nombre: 'Laura Rodríguez',       rol: 'papa'       } }),
    prisma.usuario.create({ data: { email: 'admin@escuela.com',        password: await hash('admin123'),      nombre: 'Administrador',         rol: 'admin'      } }),
    prisma.usuario.create({ data: { email: 'director@escuela.com',     password: await hash('director123'),   nombre: 'Director General',      rol: 'director'   } }),
    prisma.usuario.create({ data: { email: 'secretaria@escuela.com',   password: await hash('secretaria123'), nombre: 'Secretaría',            rol: 'secretaria' } }),
  ]);

  // ── Cursos reales ─────────────────────────────────────────────────────────
  const CURSOS_CONFIG = [
    { nombre: '7° Grado', nivel: 'primaria' },
    { nombre: '6° Grado', nivel: 'primaria' },
    { nombre: '5° Grado', nivel: 'primaria' },
    { nombre: '4° Grado', nivel: 'primaria' },
    { nombre: '3° Grado', nivel: 'primaria' },
    { nombre: '2° Grado', nivel: 'primaria' },
    { nombre: '1° Grado', nivel: 'primaria' },
    { nombre: 'Sala 5',   nivel: 'inicial'  },
    { nombre: 'Sala 4',   nivel: 'inicial'  },
    { nombre: 'Sala 3',   nivel: 'inicial'  },
    { nombre: 'Sala 2',   nivel: 'inicial'  },
  ];

  const cursoMap = {};
  for (const cfg of CURSOS_CONFIG) {
    cursoMap[cfg.nombre] = await prisma.curso.create({ data: cfg });
  }

  // ── Materias ──────────────────────────────────────────────────────────────
  const [matematica, lengua, ciencias, historia, edFisica, musica] = await Promise.all([
    prisma.materia.create({ data: { nombre: 'Matemática'         } }),
    prisma.materia.create({ data: { nombre: 'Lengua'             } }),
    prisma.materia.create({ data: { nombre: 'Ciencias Naturales' } }),
    prisma.materia.create({ data: { nombre: 'Ciencias Sociales'  } }),
    prisma.materia.create({ data: { nombre: 'Educación Física'   } }),
    prisma.materia.create({ data: { nombre: 'Música'             } }),
  ]);

  const ciclo = new Date().getFullYear();

  await prisma.cursoDocente.createMany({
    data: [
      { cursoId: cursoMap['7° Grado'].id, docenteId: docente1.id, materiaId: matematica.id, tipo: 'titular',  cicloLectivo: ciclo },
      { cursoId: cursoMap['6° Grado'].id, docenteId: docente2.id, materiaId: lengua.id,     tipo: 'titular',  cicloLectivo: ciclo },
      { cursoId: cursoMap['5° Grado'].id, docenteId: docente3.id, materiaId: ciencias.id,   tipo: 'titular',  cicloLectivo: ciclo },
      { cursoId: cursoMap['7° Grado'].id, docenteId: docente2.id, materiaId: edFisica.id,   tipo: 'especial', cicloLectivo: ciclo },
      { cursoId: cursoMap['6° Grado'].id, docenteId: docente3.id, materiaId: musica.id,     tipo: 'especial', cicloLectivo: ciclo },
    ],
  });

  // ── Alumnos reales (91 alumnos del registro 2026) ─────────────────────────
  console.log(`\n📚 Insertando ${ALUMNOS_DATA.length} alumnos...`);

  const alumnosCreados = [];
  for (const a of ALUMNOS_DATA) {
    const alumno = await prisma.alumno.create({
      data: {
        nombre:              a.n,
        cursoId:             cursoMap[a.g].id,
        sexo:                a.s   ?? null,
        fechaNacimiento:     pd(a.fn),
        nacionalidad:        a.nac ?? null,
        dni:                 a.dni ?? null,
        nombreResponsable:   a.resp ?? null,
        dniResponsable:      a.dniR ?? null,
        domicilio:           a.dom ?? null,
        telefonoResponsable: a.tel ?? null,
      },
    });
    alumnosCreados.push({ ...alumno, grado: a.g });
  }

  // ── Vincular papás demo a algunos alumnos ─────────────────────────────────
  const septimosAlumnos = alumnosCreados.filter((a) => a.grado === '7° Grado');
  if (septimosAlumnos.length >= 2) {
    await prisma.papaAlumno.createMany({
      data: [
        { papaId: papa1.id, alumnoId: septimosAlumnos[0].id },
        { papaId: papa2.id, alumnoId: septimosAlumnos[1].id },
      ],
    });
  }

  // ── Anuncio y evento de ejemplo ───────────────────────────────────────────
  await prisma.anuncio.create({
    data: {
      titulo: 'Bienvenidos al ciclo lectivo 2026',
      contenido: 'Les damos la bienvenida a todos los alumnos y familias. Cualquier consulta pueden comunicarse a través del sistema.',
      creadorId: director.id,
    },
  });

  await prisma.evento.create({
    data: {
      titulo: 'Reunión de padres — inicio de año',
      descripcion: 'Reunión general primer trimestre con todos los padres y docentes.',
      fecha: new Date(Date.now() + 7 * 86400000),
      tipo: 'reunion',
      creadorId: director.id,
    },
  });

  // ── Resumen ───────────────────────────────────────────────────────────────
  const conteo = {};
  for (const a of alumnosCreados) conteo[a.grado] = (conteo[a.grado] ?? 0) + 1;

  console.log('\n✅ Seed completado!\n');
  console.log('👥 Usuarios del sistema:');
  console.log('  admin@escuela.com        → admin123');
  console.log('  director@escuela.com     → director123');
  console.log('  secretaria@escuela.com   → secretaria123');
  console.log('  ana@escuela.com          → 123456  (docente)');
  console.log('  carlos@escuela.com       → 123456  (docente)');
  console.log('  maria@escuela.com        → 123456  (docente)');
  console.log('  juan@gmail.com           → 123456  (papa — vinculado a 7° Grado)');
  console.log('  laura@gmail.com          → 123456  (papa — vinculado a 7° Grado)');
  console.log('\n📚 Alumnos por grado:');
  for (const [g, c] of Object.entries(conteo)) {
    console.log(`  ${g}: ${c} alumnos`);
  }
  console.log(`\n  Total: ${alumnosCreados.length} alumnos`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
