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
