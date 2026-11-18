-- Species catalog: 93 houseplants.
--
-- Source: seed_data/common-houseplants-data.csv in
-- https://github.com/anjelicasilva/ispeakplantish (Hackbright Academy 2020
-- capstone project; the data appears to come from houseofplants.co.uk).
-- The repository has no licence, so only facts are taken from it:
--   - "Latin Name"  -> scientific_name (copied as written, see below)
--   - "Common Name" -> common_name (one name for both interface languages)
--   - "Light"       -> recommended_light: Low -> LOW, Medium -> MEDIUM,
--                      High -> BRIGHT_INDIRECT
-- Descriptions and photo links from the source are NOT copied (third-party
-- text and images without permission). Photos will come from Wikimedia
-- Commons with attribution.
--
-- Data status: TO VERIFY.
-- - Names are copied as written in the source, including its capitalisation
--   (e.g. "Aloe Vera") and some misspellings (e.g. "Zamioculcas Zamifolia",
--   "Pilea Peperomiodes", "Sansevieria Cylindrico", "Vriesia Gigantia").
-- - Light values were not checked; some look doubtful (e.g. Aspidistra
--   elatior, the "cast iron plant", is "High").
-- - Changed on purpose: the common name "Wandering Jew" is replaced by
--   "Inch Plant" (the old name is considered offensive).
--
-- Changes to the catalog go in a NEW migration; never edit this one after it
-- has been applied.

INSERT INTO "species" ("id", "scientific_name", "common_name", "recommended_light", "updated_at") VALUES
  (gen_random_uuid(), 'Ficus Cyathistipula', 'African Fig Tree', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Aloe Vera', 'Aloe Vera', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Chrysalidocarpus Lutescens', 'Areca Palm', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Peperomia Obtusifolia Golden Gate', 'Baby Rubber Plant', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Chamaedorea Seifrizii', 'Bamboo Palm', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Ficus Benghalensis', 'Bengal Fig', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Strelitzia Reginae', 'Bird of Paradise', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Asplenium ''Leslie''', 'Bird''s Nest Fern', 'LOW', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Zamioculcas Zamiifolia ''Raven''', 'Black ZZ Plant', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Aechmea ''Blue Rain''', 'Blue Rain Bromeliad', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Nephrolepis Exaltata Bostoniensis', 'Boston Fern', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Stromanthe Triostar', 'Calathea Triostar', 'LOW', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Aspidistra Elatior', 'Cast Iron Plant', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Ficus Microcarpa', 'Chinese Banyan', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Aglaonema Christine', 'Chinese Evergreen ‘Christine’', 'LOW', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Aglaonema Cutlass', 'Chinese Evergreen ‘Cutlass’', 'LOW', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Pilea Peperomiodes', 'Chinese Money Plant', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Dracaena Compacta', 'Compact Dragon Tree', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Codiaeum ''Iceton''', 'Croton Iceton', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Codiaeum Variegatum ''Petra''', 'Croton Petra', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Epipremnum Aureum (Scindapsus Aureus)', 'Devils Ivy', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Dracaena Deremensis ''Janet Craig''', 'Dragon Tree ''Janet Craig''', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Dracaena ''Lemon and Lime''', 'Dragon Tree ''Lemon and Lime''', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Dracaena Deremensis Warneckii', 'Dragon Tree ‘Warneckii’', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Dieffenbachia', 'Dumb Cane', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Oxalis Triangularis Purpurea', 'False Shamrock', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Ficus Lyrata', 'Fiddle Leaf Fig', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Ficus Binnendijkii ''Amstel King''', 'Fig Tree', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Epiphyllum Anguliger', 'Fishbone Cactus', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Monstera Adansonii', 'Five Holes Plant', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Gloriosa Rothschildiana', 'Flame Lily', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Vriesia Gigantia ''Nova''', 'Giant Vriesea', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Strelitzia Nicolai', 'Giant White Bird of Paradise', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Crassula ''Hummel''s Sunset''', 'Golden Jade Tree', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Cissus Rhombifolia', 'Grape Ivy', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Davallia Canariensis', 'Hare''s Foot Fern', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Maranta Leuconeura Erythrophylla', 'Herringbone Plant', 'LOW', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Crassula ''Horntree''', 'Hobbit Jade', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Araucaria Cunninghamii ''Bonsai''', 'Hoop Pine', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Ficus Nitida', 'Indian Laurel', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Microsorum Diversifolium', 'Kangaroo Fern', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Howea Forsteriana', 'Kentia Palm', 'LOW', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Aeschynanthus Japhrolepis', 'Lipstick Plant', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Aeschynanthus Pulcher ''Mona Lisa''', 'Lipstick Plant ‘Mona Lisa’', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Ficus Binnendijkii ''Alii''', 'Long Leaved Fig', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Dracaena Marginata', 'Madagascar Dragon Tree', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Pachypodium Lamerei', 'Madagascar Palm', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Adiantum Fragrans', 'Maidenhair Fern', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Medinilla Magnifica', 'Medinilla', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Chamaedorea Metallica', 'Metallic Palm', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Crassula Minor', 'Mini Jade Plant', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Rhipsalis', 'Mistletoe Cacti', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Crassula Ovata', 'Money Tree', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Sansevieria Trifasciata Laurentii', 'Mother-in-Laws Tongue', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Sansevieria Zeylanica', 'Mother-in-Laws Tongue ‘Zeylanica’', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Araucaria Heterophylla', 'Norfolk Island Pine', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Philodendron Pedatum', 'Oak Leaf Philodendron', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Chamaedorea Elegans', 'Parlour Palm', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Spathiphyllum Wallisii', 'Peace Lily', 'LOW', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Calathea Orbifolia', 'Peacock Plant', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Calathea Sanderiana', 'Pin Stripe Calathea', 'LOW', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Dracaena Reflexa ''Anita''', 'Pleomele Anita', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Beaucarnea Recurvata', 'Pony Tail Palm', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Maranta Kerchoveana', 'Prayer Plant', 'LOW', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Opuntia', 'Prickly Pear', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Peperomia ''Piccolo Banda''', 'Radiator Plant ‘Piccolo Banda’', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Peperomia Caperata ''Rosso''', 'Radiator Plant ‘Rosso’', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Calathea Lancifolia', 'Rattlesnake Plant', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Hibiscus Rosa-Sinensis', 'Rose of China', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Calathea Roseopicta', 'Rose Painted Calathea', 'LOW', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Ficus Elastica ''Bali''', 'Rubber Plant', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Sansevieria volkensii', 'Sansevieria Volkensii', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Scindapsus Pictus', 'Satin Pothos', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Sansevieria Cylindrico', 'Snake Plant ‘Cylindrico’', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Sansevieria Trifasciata Black Coral', 'Snake Plant ‘Black Coral’', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Chlorophytum Comosum Variegata', 'Spider Plant', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Yucca Elephantipes', 'Spineless Yucca', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Begonia Maculata ''Wightii''', 'Spotted Begonia', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Platycerium Bifurcatum', 'Staghorn Fern', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Sansevieria Kirkii', 'Star Sansevieria', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Senecio Herreianus', 'String of Beads', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Ceropegia Woodii', 'String of Hearts', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Dischidia Nummularia', 'String of Nickels', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Philodendron Scandens', 'Sweetheart Plant', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Monstera Deliciosa', 'Swiss Cheese Plant', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Ficus Triangularis Variegata', 'Triangle Fig', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Schefflera Arboricola', 'Umbrella Plant', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Calathea Rufibarba', 'Velvet Calathea', 'LOW', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Tradescantia Zebrina', 'Inch Plant', 'MEDIUM', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Hoya Carnosa Tricolour', 'Wax Flower', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Ficus Benjamina', 'Weeping Fig', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Aeschynanthus Marmoratus', 'Zebra Basket Vine', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Zamioculcas Zamifolia', 'ZZ Plant', 'BRIGHT_INDIRECT', CURRENT_TIMESTAMP)
ON CONFLICT ("scientific_name") DO NOTHING;
