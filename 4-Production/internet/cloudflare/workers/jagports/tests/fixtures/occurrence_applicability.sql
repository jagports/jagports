-- Synthetic persistence fixture, informed by observed catalogue identities.
-- Context versions/mapping/coverage are test data, not verified JEPC imports.
INSERT INTO part(id, part_number_raw, part_number_normalized, source, verification_status) VALUES
 (65901,'HJB9670AA','HJB9670AA','fixture','fixture'),
 (65902,'HJE9042AB','HJE9042AB','fixture','fixture'),
 (65903,'LJA4501AG','LJA4501AG','fixture','fixture'),
 (65904,'LJA4511AG','LJA4511AG','fixture','fixture');
INSERT INTO model_range(id,range_code,name,source) VALUES(65901,'FIX659-XK','XK applicability fixture','fixture');
INSERT INTO vin_range(id,vin_prefix,serial_start,serial_end,source) VALUES(65901,'FIX659','023700','042775','fixture');
INSERT INTO part_occurrence(id,part_id,source,source_ref,category_ref,item_number,context_ref) VALUES
 (65901,65901,'fixture','3187/11096/1/151439','11096','1','151439'),
 (65902,65901,'fixture','3178/9504/1/151441','9504','1','151441'),
 (65903,65902,'fixture','3178/9504/1/171081','9504','1','171081'),
 (65904,65902,'fixture','3173/9502/1/171082','9502','1','171082'),
 (65905,65903,'fixture','3187/8069/1/145251','8069','1','145251'),
 (65906,65904,'fixture','3178/8059/1/145267','8059','1','145267');
INSERT INTO applicability_bundle(id,source_namespace,bundle_key) VALUES
 (65901,'fixture','3187/11096/1'),(65902,'fixture','3178/9504/1'),
 (65903,'fixture','3173/9502/1'),(65904,'fixture','3187/8069/1'),(65905,'fixture','3178/8059/1');
INSERT INTO applicability_snapshot(id,bundle_id,revision,parser_version,mapping_version,state) VALUES
 (65901,65901,1,'fixture-parser','fixture-map','active'),
 (65902,65902,1,'fixture-parser','fixture-map','active'),
 (65903,65903,1,'fixture-parser','fixture-map','active'),
 (65904,65904,1,'fixture-parser','fixture-map','active'),
 (65905,65905,1,'fixture-parser','fixture-map','active');
INSERT INTO applicability_evidence(id,snapshot_id,relative_path,file_sha256,record_locator,raw_record) VALUES
 (65901,65901,'fixture/model-list',printf('%064d',1),'3187','up to 042775'),
 (65902,65902,'fixture/model-list',printf('%064d',2),'3178','A00083 through A30644'),
 (65903,65903,'fixture/model-list',printf('%064d',3),'3173','from A30645'),
 (65904,65904,'fixture/headlamp-item',printf('%064d',4),'110080001','headlamp levelling / Except Japan / RHD / LH side'),
 (65905,65904,'fixture/headlamp-item',printf('%064d',4),'1100310001','Except headlamp powerwash / Except Japan / RHD / LH side'),
 (65906,65905,'fixture/later-headlamp-item',printf('%064d',5),'110040001','HEADLAMP ASSEMBLY-NON POWERWASH ($) / Canada / Except headlamp levelling / LH side');
INSERT INTO applicability_serial_range(id,serial_domain,comparator,lower_state,lower_value,lower_inclusive,upper_state,upper_value,upper_inclusive,vin_range_id) VALUES
 (65901,'XK-numeric-fixture','unverified:decimal6','unknown',NULL,NULL,'known','042775',1,NULL),
 (65902,'XK-A-fixture','unverified:A5','known','A00083',1,'known','A30644',1,NULL),
 (65903,'XK-A-fixture','unverified:A5','known','A30645',1,'unknown',NULL,NULL,NULL),
 (65904,'XK-numeric-fixture','unverified:decimal6','known','023700',1,'unbounded',NULL,NULL,NULL),
 (65905,'XK-A-fixture','unverified:A5','unbounded',NULL,NULL,'known','A00115',1,NULL),
 (65906,'XK-A-fixture','unverified:A5','known','A11051',1,'unbounded',NULL,NULL,NULL),
 (65907,'XK-numeric-fixture','unverified:decimal6','known','023700',1,'known','042775',1,65901);
INSERT INTO applicability_model_context(id,source_namespace,source_model_id,context_version,source_parent_id,model_range_id,serial_range_id) VALUES
 (65901,'fixture','3187','fixture-v1','3175',65901,65901),
 (65902,'fixture','3178','fixture-v1','3175',65901,65902),
 (65903,'fixture','3173','fixture-v1','3175',65901,65903);
INSERT INTO applicability_context_evidence VALUES(65901,65901),(65902,65902),(65903,65903);
INSERT INTO occurrence_applicability(id,snapshot_id,source_key,part_occurrence_id,model_context_id) VALUES
 (65901,65901,'151439',65901,65901),(65902,65902,'151441',65902,65902),
 (65903,65902,'171081',65903,65902),(65904,65903,'171082',65904,65903),
 (65905,65904,'145251',65905,65901),(65906,65905,'145267',65906,65902);
INSERT INTO applicability_condition_set(id,assertion_id,set_key,serial_range_id) VALUES
 (65901,65901,'from-023700',65904),(65902,65902,'through-A00115',65905),
 (65903,65903,'from-A11051',65906),(65904,65904,'no-item-serial-header',NULL),
 (65905,65905,'levelling-path',NULL),(65906,65905,'except-powerwash-path',NULL),
 (65907,65906,'Canada-except-levelling',NULL);
UPDATE applicability_condition_set SET effective_serial_range_id=65907 WHERE id=65901;
INSERT INTO applicability_dimension(id,code) VALUES
 (65901,'steering'),(65902,'installation_side'),(65903,'market'),
 (65904,'headlamp_levelling'),(65905,'headlamp_powerwash');
INSERT INTO applicability_dimension_value VALUES
 (65901,'RHD'),(65901,'LHD'),(65902,'LH'),(65902,'RH'),(65903,'Japan'),
 (65903,'USA'),(65903,'Canada'),(65904,'present'),(65905,'present');
INSERT INTO applicability_attribute_condition(id,set_id,dimension_id,operator,value_code) VALUES
 (65901,65905,65901,'equals','RHD'),(65902,65905,65902,'equals','LH'),
 (65903,65905,65903,'not_equals','Japan'),(65904,65905,65904,'equals','present'),
 (65905,65906,65901,'equals','RHD'),(65906,65906,65902,'equals','LH'),
 (65907,65906,65903,'not_equals','Japan'),(65908,65906,65905,'not_equals','present'),
 (65909,65907,65903,'equals','Canada'),(65910,65907,65902,'equals','LH'),
 (65911,65907,65904,'not_equals','present');
INSERT INTO applicability_set_evidence VALUES
 (65901,65901),(65902,65902),(65903,65902),(65904,65903),(65905,65904),(65906,65905),(65907,65906);

-- #641 / #877 synthetic pre-JEPC suitability fixture dataset v1.
-- Loaded only by the test fixture helper, NEVER by a production migration.
-- Logical F-SUIT-* identities and X100/X150 names below are synthetic, not
-- real Jaguar PNs, source applicability or imported catalogue claims.
INSERT INTO part (id, part_number_raw, part_number_normalized, description, source, verification_status) VALUES
 (87701,'F-SUIT-01','F-SUIT-01','Synthetic dual-occurrence suitability PART','fixture','fixture'),
 (87702,'F-SUIT-02','F-SUIT-02','Synthetic alternate suitability PART','fixture','fixture'),
 (87703,'F-SUIT-03','F-SUIT-03','Synthetic excluded-only PART','fixture','fixture'),
 (87704,'F-SUIT-04','F-SUIT-04','Synthetic unknown-only PART','fixture','fixture'),
 (87705,'F-SUIT-05','F-SUIT-05','Synthetic other-context PART','fixture','fixture');
INSERT INTO model_range (id, range_code, name, source) VALUES
 (87701,'FIX877-X100','Synthetic X100 model context','fixture'),
 (87702,'FIX877-X150','Synthetic X150 model context','fixture');
INSERT INTO part_occurrence
 (id,part_id,source,source_ref,context_type,context_ref,verification_status) VALUES
 (87711,87701,'fixture:pre-jepc-suitability:v1','O-A','epc','FIX877-X100','fixture'),
 (87712,87701,'fixture:pre-jepc-suitability:v1','O-B','epc','FIX877-X100','fixture'),
 (87713,87702,'fixture:pre-jepc-suitability:v1','O-C','epc','FIX877-X100','fixture'),
 (87714,87703,'fixture:pre-jepc-suitability:v1','O-D','epc','FIX877-X100','fixture'),
 (87715,87704,'fixture:pre-jepc-suitability:v1','O-E','epc','FIX877-X100','fixture'),
 (87716,87705,'fixture:pre-jepc-suitability:v1','O-F','epc','FIX877-X150','fixture');

INSERT INTO applicability_bundle (id,source_namespace,bundle_key)
VALUES (87701,'fixture:pre-jepc-suitability:v1','fixture-only');
INSERT INTO applicability_snapshot
 (id,bundle_id,revision,parser_version,mapping_version,coverage,state)
VALUES (87701,87701,1,'synthetic-v1','fixture-mapping-v1','incomplete','active');
INSERT INTO applicability_evidence
 (id,snapshot_id,relative_path,file_sha256,record_locator,raw_record) VALUES
 (87701,87701,'fixture-only/877',printf('%064x',87701),'O-A','synthetic: coupe LHD SC memory+powered'),
 (87702,87701,'fixture-only/877',printf('%064x',87701),'O-B','synthetic: convertible RHD NA powered'),
 (87703,87701,'fixture-only/877',printf('%064x',87701),'O-C','synthetic: coupe RHD NA'),
 (87704,87701,'fixture-only/877',printf('%064x',87701),'O-D','synthetic: scoped excluded convertible LHD'),
 (87705,87701,'fixture-only/877',printf('%064x',87701),'O-E','synthetic: unresolved aspiration'),
 (87706,87701,'fixture-only/877',printf('%064x',87701),'O-F','synthetic: separate X150 context');
INSERT INTO applicability_model_context
 (id,source_namespace,source_model_id,context_version,model_range_id,verification) VALUES
 (87721,'fixture:pre-jepc-suitability:v1','FIX877-X100','v1',87701,'verified'),
 (87722,'fixture:pre-jepc-suitability:v1','FIX877-X150','v1',87702,'verified');
INSERT INTO occurrence_applicability
 (id,snapshot_id,source_key,part_occurrence_id,model_context_id,effect,verification,coverage) VALUES
 (87731,87701,'O-A',87711,87721,'include','verified','complete'),
 (87732,87701,'O-B',87712,87721,'include','verified','complete'),
 (87733,87701,'O-C',87713,87721,'include','verified','complete'),
 (87734,87701,'O-D',87714,87721,'exclude','verified','complete'),
 (87735,87701,'O-E',87715,87721,'include','unverified','incomplete'),
 (87736,87701,'O-F',87716,87722,'include','verified','complete');
INSERT INTO applicability_condition_set
 (id,assertion_id,set_key,coverage,unconditional) VALUES
 (87741,87731,'whole-O-A','complete',0),
 (87742,87732,'whole-O-B','complete',0),
 (87743,87733,'whole-O-C','complete',0),
 (87744,87734,'scoped-exclusion-O-D','complete',0),
 (87745,87735,'unresolved-O-E','incomplete',0),
 (87746,87736,'whole-O-F','complete',0);
INSERT INTO applicability_set_evidence (set_id,evidence_id) VALUES
 (87741,87701),(87742,87702),(87743,87703),
 (87744,87704),(87745,87705),(87746,87706);
INSERT INTO applicability_context_evidence (context_id,evidence_id) VALUES
 (87721,87701),(87722,87706);

-- Preserve the existing steering dimension (65901) and its LHD/RHD codes.
-- Fixture-only source-qualified descriptions may coexist in one set.
INSERT INTO applicability_dimension (id,code,verification) VALUES
 (87701,'body','unverified'),
 (87702,'engine_aspiration','unverified'),
 (87703,'seat_equipment','unverified');
INSERT INTO applicability_dimension_value (dimension_id,value_code) VALUES
 (87701,'coupe'),(87701,'convertible'),
 (87702,'na'),(87702,'supercharged'),
 (87703,'memory_seat'),(87703,'powered_seats');
-- Immutable synthetic description keys: duplicate visible text under a
-- different source group never implies approved synonymy.
INSERT INTO applicability_source_description
 (id,source_namespace,dataset_key,source_key,source_language,source_group_code,
  source_value_code,source_model_ref,source_tree_path,record_locator,
  original_text,provenance_kind,evidence_id) VALUES
 (87701,'fixture:pre-jepc-suitability:v1','v1','body-coupe','en','body','coupe','FIX877-X100','body','fixture/body/coupe','Coupe','fixture',87701),
 (87702,'fixture:pre-jepc-suitability:v1','v1','body-convertible','en','body','convertible','FIX877-X100','body','fixture/body/convertible','Convertible','fixture',87702),
 (87703,'fixture:pre-jepc-suitability:v1','v1','steering-lhd','en','steering','LHD','FIX877-X100','steering','fixture/steering/lhd','LHD','fixture',87701),
 (87704,'fixture:pre-jepc-suitability:v1','v1','steering-rhd','en','steering','RHD','FIX877-X100','steering','fixture/steering/rhd','RHD','fixture',87702),
 (87705,'fixture:pre-jepc-suitability:v1','v1','aspiration-na','en','aspiration','na','FIX877-X100','engine','fixture/aspiration/na','NA','fixture',87702),
 (87706,'fixture:pre-jepc-suitability:v1','v1','aspiration-sc','en','aspiration','supercharged','FIX877-X100','engine','fixture/aspiration/supercharged','Supercharged','fixture',87701),
 (87707,'fixture:pre-jepc-suitability:v1','v1','seat-memory','en','seat','memory_seat','FIX877-X100','equipment','fixture/seat/memory','Memory Seat','fixture',87701),
 (87708,'fixture:pre-jepc-suitability:v1','v1','seat-powered','en','seat','powered_seats','FIX877-X100','equipment','fixture/seat/powered','Powered Seats','fixture',87701),
 (87709,'fixture:pre-jepc-suitability:v1','v1','unresolved-other-coupe','en','unresolved-body','unknown','FIX877-X150','unknown','fixture/other/coupe','Coupe','fixture',87706),
 (87710,'fixture:pre-jepc-suitability:v1','v1','reviewed-alias-coupe','en','body-alias','coupe','FIX877-X100','body','fixture/body/alias-coupe','Coupe','fixture',87703),
 (87711,'fixture:pre-jepc-suitability:v1','v1','x150-body-coupe','en','body','coupe','FIX877-X150','body','fixture/x150/body/coupe','Coupe','fixture',87706),
 (87712,'fixture:pre-jepc-suitability:v1','v1','x150-steering-rhd','en','steering','RHD','FIX877-X150','steering','fixture/x150/steering/rhd','RHD','fixture',87706),
 (87713,'fixture:pre-jepc-suitability:v1','v1','x150-aspiration-sc','en','aspiration','supercharged','FIX877-X150','engine','fixture/x150/aspiration/supercharged','Supercharged','fixture',87706);
INSERT INTO applicability_description_mapping_revision
 (id,source_description_id,revision,dimension_id,value_code,status,mapping_version,evidence_note) VALUES
 (87701,87701,1,87701,'coupe','fixture','fixture-v1','Synthetic source mapping; not JEPC evidence'),
 (87702,87702,1,87701,'convertible','fixture','fixture-v1','Synthetic source mapping; not JEPC evidence'),
 (87703,87703,1,65901,'LHD','fixture','fixture-v1','Synthetic source mapping; not JEPC evidence'),
 (87704,87704,1,65901,'RHD','fixture','fixture-v1','Synthetic source mapping; not JEPC evidence'),
 (87705,87705,1,87702,'na','fixture','fixture-v1','Synthetic source mapping; not JEPC evidence'),
 (87706,87706,1,87702,'supercharged','fixture','fixture-v1','Synthetic source mapping; not JEPC evidence'),
 (87707,87707,1,87703,'memory_seat','fixture','fixture-v1','Synthetic source mapping; not JEPC evidence'),
 (87708,87708,1,87703,'powered_seats','fixture','fixture-v1','Synthetic source mapping; not JEPC evidence'),
 (87709,87709,1,87701,'coupe','proposed','fixture-v1','Same visible text in another group; not approved'),
 (87710,87710,1,87701,'coupe','fixture','fixture-v1','Distinct source identity, independently synthetic-reviewed alias'),
 (87711,87711,1,87701,'coupe','fixture','fixture-v1','Separate X150 source identity'),
 (87712,87712,1,65901,'RHD','fixture','fixture-v1','Separate X150 source identity'),
 (87713,87713,1,87702,'supercharged','fixture','fixture-v1','Separate X150 source identity');

-- Approved normalized domain vocabulary labels, not translations of JEPC text.
-- Finnish entries are proposals pending human/Weblate linguistic review.
INSERT INTO applicability_dimension_label (dimension_id,language,name,description) VALUES
 (87701,'en','Body','Vehicle body style'),(87701,'fi','Kori','Ajoneuvon korimalli'),
 (65901,'en','Steering','Steering position'),(65901,'fi','Ohjaus','Ohjauksen sijainti'),
 (87702,'en','Engine aspiration','Engine aspiration type'),(87702,'fi','Moottorin ahtaminen','Moottorin ahtamistapa'),
 (87703,'en','Seat equipment','Seat equipment features'),(87703,'fi','Istuinvarusteet','Istuinten varustelu');
INSERT INTO applicability_dimension_value_label
 (dimension_id,value_code,language,name,description) VALUES
 (87701,'coupe','en','Coupe','Coupe body style'),(87701,'coupe','fi','Coupé','Coupé-korimalli'),
 (87701,'convertible','en','Convertible','Convertible body style'),(87701,'convertible','fi','Avoauto','Avoauton korimalli'),
 (65901,'LHD','en','LHD','Left-hand drive'),(65901,'LHD','fi','Vasemmalta ohjattava','Ohjauspyörä vasemmalla'),
 (65901,'RHD','en','RHD','Right-hand drive'),(65901,'RHD','fi','Oikealta ohjattava','Ohjauspyörä oikealla'),
 (87702,'na','en','NA','Naturally aspirated'),(87702,'na','fi','Vapaasti hengittävä','Vapaasti hengittävä moottori'),
 (87702,'supercharged','en','Supercharged','Supercharged engine'),(87702,'supercharged','fi','Mekaanisesti ahdettu','Mekaanisesti ahdettu moottori'),
 (87703,'memory_seat','en','Memory Seat','Seat memory equipment'),(87703,'memory_seat','fi','Muisti-istuin','Muistipaikoilla varustettu istuin'),
 (87703,'powered_seats','en','Powered Seats','Powered seat adjustments'),(87703,'powered_seats','fi','Sähkösäätöiset istuimet','Sähköiset istuinsäädöt');

-- These explicit source-to-alternative associations are fixture evidence,
-- not JEPC predicates or proof of Jaguar fitment. O-A's two seat labels
-- coexist because TWO separate source identities are linked to ONE set.
INSERT INTO applicability_set_description_evidence
 (set_id,mapping_revision_id,evidence_id,verification) VALUES
 (87741,87701,87701,'fixture'),(87741,87703,87701,'fixture'),
 (87741,87706,87701,'fixture'),(87741,87707,87701,'fixture'),
 (87741,87708,87701,'fixture'),
 (87742,87702,87702,'fixture'),(87742,87704,87702,'fixture'),
 (87742,87705,87702,'fixture'),(87742,87708,87702,'fixture'),
 (87743,87710,87703,'fixture'),(87743,87704,87703,'fixture'),
 (87743,87705,87703,'fixture'),
 (87744,87702,87704,'fixture'),(87744,87703,87704,'fixture'),
 (87745,87701,87705,'fixture'),
 (87746,87711,87706,'fixture'),(87746,87712,87706,'fixture'),
 (87746,87713,87706,'fixture');
