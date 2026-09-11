# VIEPS UI Visualization AI Prompt

Generate mockup visualization image PNG from modern looking web browser where is open stylished VIEPS application, with MVP and post-MVP features. Application page must only have elements that are currently open or last versions of closed issues and PRs. Follow elements positioning from .emf file and latest ASCII map.

Follow elements from specs and .emf. Parts location on car area must exist. Shows single parts on tree and open branche, show only one part image, suitability view must show many vehicle models. Don't include menu, cause any of my specs doesn't define such.

Use real part number MNC1628AA and as part details view the attached image. Append parts details above Explosion image, do not generate two parts elements.

Make sure part left/right is correctly set. Left and right are determined from driver's seat when looking towards the car's front. It is front wheel left vertical link. Determine search suitability to cars and location etc. from internet and then prompt to yourself so image would be more to specs.

Use stylished version from explosion image from here: https://parts.jaguarlandroverclassic.com/mnc1628aa-vertical-link.html

Generate Suitability list based on suitability here: https://www.ebay.com/itm/377432368949 (even that is wrong and too long, use only part of it).

## Reference visualization

Use `5-Implementation-Projects/internet/jagports/solution/vieps/UI/UI_Visualization_AI_Prompt.png` as the current sample/reference visualization for this prompt. Future generated reference visualizations should use PNG format.

## Required visualization constraints

- Modern web-browser presentation of VIEPS.
- Preserve the Concept View-1 / EMF information architecture and positioning.
- No application menu unless a current specification explicitly defines one.
- Part-number search visibly contains `MNC1628AA`.
- Parts Tree shows one relevant open path and one selected part context rather than a general multi-branch catalogue browser.
- Parts-location area shows the whole car in both plan/top view and side view.
- Both vehicle views identify the **front-left** location with a clear bounded/highlighted area.
- Vehicle left/right is always determined from the driver's seated orientation looking forward.
- `MNC1628AA` is the front-left vertical link context for this visualization.
- Part details appear above the exploded/part image in the same details area.
- Show only one part/exploded-image element; do not create a second independent part-image panel.
- Use the supplied Jaguar exploded-view image as the visual reference for the part-details/explosion area and preserve its recognizable component arrangement while styling it for the VIEPS mockup.
- Suitability must be a list/table containing multiple applicable vehicle/model entries, using only a reasonable subset of the referenced suitability source rather than reproducing its entire list.
- MVP and post-MVP elements may be shown only when supported by current open issues or the latest superseding/closed specifications and PRs.
- Do not imply unavailable or unverified information is verified production data; use explicit illustrative/unavailable states where appropriate.
