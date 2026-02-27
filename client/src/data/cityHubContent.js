/**
 * Unique editorial content for top city hub pages.
 *
 * Each entry contains hand-written, city-specific prose that Google cannot
 * dismiss as templated programmatic SEO. The content covers local wedding
 * culture, neighborhoods, marriage-license logistics, and the counseling
 * landscape — details only a human familiar with the city would know.
 *
 * Keyed by "stateSlug/citySlug" for O(1) lookup from CityPage.
 */

const CITY_HUB_CONTENT = {
  // ─────────────────────────────────────────────
  // 1. New York City, NY
  // ─────────────────────────────────────────────
  'new-york/new-york': {
    heading: 'Getting Married in New York City',
    paragraphs: [
      `New York City is one of the most popular places in the world to get married, with the City Clerk's office in Lower Manhattan processing thousands of marriage licenses every year. Couples can apply for their license at any of the five borough clerk offices — Manhattan, Brooklyn, Queens, the Bronx, or Staten Island — and there is no waiting period in New York State, meaning you can marry the same day you receive your license. The license fee is $35, one of the most affordable in the country, and it remains valid for 60 days.`,

      `The city's wedding scene spans rooftop ceremonies in Williamsburg, grand affairs at The Plaza or Cipriani, intimate gatherings in Central Park (a free permit is required for groups over 20), and City Hall elopements that have become a beloved tradition in their own right. Brooklyn's Prospect Park Boathouse and the Brooklyn Botanic Garden remain perennial favorites, while Queens and the Bronx offer more budget-friendly venue options without sacrificing character.`,

      `For couples preparing for marriage in New York, the sheer variety of counseling options reflects the city itself. Manhattan is home to a dense concentration of licensed marriage and family therapists (LMFTs) and psychologists who specialize in premarital work, many trained in evidence-based methods like the Gottman Method or Prepare/Enrich. Brooklyn and Queens have seen a surge of younger, culturally responsive counselors who work with interfaith, interracial, and LGBTQ+ couples. Faith-based premarital counseling is also deeply rooted here — from Catholic Pre-Cana programs offered in parishes across all five boroughs, to Jewish chosson and kallah classes, to premarital mentoring at Protestant megachurches in Times Square and Brooklyn Heights.`,

      `New York couples tend to seek premarital counseling for practical reasons as well as emotional ones: navigating how to merge finances in one of the most expensive cities on earth, deciding whether to keep separate apartments, handling in-law dynamics across cultures, and managing the stress of planning a wedding that can easily cost six figures. A good premarital counselor in NYC helps couples cut through the noise and build a realistic plan for married life — not just a beautiful wedding day.`
    ]
  },

  // ─────────────────────────────────────────────
  // 2. Los Angeles, CA
  // ─────────────────────────────────────────────
  'california/los-angeles': {
    heading: 'Getting Married in Los Angeles',
    paragraphs: [
      `Los Angeles County issues more marriage licenses than nearly any other county in the United States. Couples can apply online through the LA County Registrar-Recorder and schedule an appointment at any branch office. California has no waiting period — your license is valid immediately and stays active for 90 days. The current fee is $91 for a public marriage license or $85 for a confidential one, a California-specific option that keeps your marriage record out of public search databases.`,

      `LA weddings are as varied as the city's sprawling geography. Malibu clifftop ceremonies overlooking the Pacific, garden weddings at the Los Angeles River Center in Cypress Park, rooftop celebrations downtown with skyline views, and casual backyard receptions in Silver Lake or Highland Park are all part of the landscape. The Getty Center, Griffith Observatory (for photos, not ceremonies), and various historic theaters in Hollywood and Pasadena remain iconic choices. Many couples also take advantage of Southern California's year-round sunshine for outdoor ceremonies at botanical gardens, vineyards in Malibu Canyon, or beachfront spots in Santa Monica and Venice.`,

      `The counseling community in Los Angeles reflects the city's diversity and its entertainment industry roots. Many therapists here specialize in high-pressure careers, blended families, and cross-cultural relationships. West LA and Beverly Hills have a concentration of psychologists who work with entertainment and business professionals, while East LA and the San Fernando Valley are home to bilingual counselors serving Spanish-speaking couples. Pasadena and the San Gabriel Valley have strong faith-based counseling networks, particularly through Catholic and evangelical churches. LGBTQ+-affirming premarital counselors are widely available across the Westside and in neighborhoods like West Hollywood and Silver Lake.`,

      `LA couples often come to premarital counseling grappling with lifestyle questions unique to the city: managing long commutes that eat into quality time, handling income disparities in an industry-driven economy, deciding where to put down roots in a metro area that stretches 70 miles, and building community when both partners may have relocated from other states or countries. The best premarital counselors here help couples create shared rhythms in a city that constantly pulls people in different directions.`
    ]
  },

  // ─────────────────────────────────────────────
  // 3. Chicago, IL
  // ─────────────────────────────────────────────
  'illinois/chicago': {
    heading: 'Getting Married in Chicago',
    paragraphs: [
      `Chicago couples obtain their marriage license from the Cook County Clerk's office at 50 W. Washington Street in the Loop, or at one of several suburban branch locations. Illinois requires a one-day waiting period after the license is issued — you receive it the day you apply but cannot marry until the following day. The license costs $60 for Cook County residents and $75 for non-residents, and it's valid for 60 days. No blood test is required.`,

      `The city offers some of the most architecturally stunning wedding venues in the Midwest. The Chicago Cultural Center on Michigan Avenue — with its Tiffany glass dome — hosts free public ceremonies and private events alike. River North and the West Loop are packed with industrial-chic loft venues, while Lincoln Park and the Gold Coast offer more traditional settings in historic mansions and hotel ballrooms. Navy Pier, the Art Institute's modern wing, and the Garfield Park Conservatory are popular for couples who want a venue with character. Budget-conscious couples often look to neighborhood favorites in Pilsen, Logan Square, or Bridgeport for authentic Chicago charm at a fraction of downtown prices.`,

      `Chicago has one of the strongest premarital counseling communities in the country, anchored by a large network of licensed clinical social workers (LCSWs), licensed professional counselors (LPCs), and marriage and family therapists. The city's North Side — particularly Lincoln Park, Lakeview, and Ravenswood — has a high concentration of therapists trained in Gottman Method and Emotionally Focused Therapy. The South Side and western suburbs have robust faith-based premarital programs, especially through Catholic parishes that offer Pre-Cana weekends and through African American churches with structured marriage ministries. Many counselors in the city also specialize in working with first-generation and immigrant couples navigating bicultural marriages.`,

      `Practical concerns that Chicago couples often bring to premarital counseling include managing finances in a city with a high cost of living but more affordable than the coasts, deciding between city and suburban life as families grow, handling harsh winters that can strain relationships, and navigating large, opinionated Midwestern families. Chicago's counselors understand these pressures and help couples build communication habits that outlast the wedding weekend.`
    ]
  },

  // ─────────────────────────────────────────────
  // 4. Houston, TX
  // ─────────────────────────────────────────────
  'texas/houston': {
    heading: 'Getting Married in Houston',
    paragraphs: [
      `Houston marriage licenses are issued through the Harris County Clerk's office downtown or at satellite locations across the county. Texas has a 72-hour waiting period after the license is issued — but couples who complete a state-approved premarital education course can waive that waiting period entirely and also save $60 on the license fee, bringing the cost down from $81 to $21. The license is valid for 90 days, and no blood test is required.`,

      `As the fourth-largest city in America, Houston's wedding scene is enormous and wildly diverse. The Museum District and Hermann Park offer elegant outdoor settings, while Montrose and the Heights have a growing collection of converted warehouses and art galleries used as event spaces. River Oaks and Memorial set the standard for upscale hotel and country club weddings. The Kemah Boardwalk and Galveston Island — an hour south — give couples a Gulf Coast beach option. Many Houston couples also embrace the city's international character with multicultural ceremonies that blend Nigerian, Vietnamese, Mexican, Indian, and Southern traditions, often in the same weekend.`,

      `Houston's premarital counseling landscape mirrors its diversity. The Texas Medical Center area and Upper Kirby have a concentration of licensed marriage therapists and psychologists, many affiliated with Baylor College of Medicine or the University of Houston's counseling programs. The city's African American churches — particularly in Third Ward, Sunnyside, and Missouri City — run some of the most established faith-based marriage preparation ministries in the South. Houston also has a sizable Catholic premarital counseling network, with Pre-Cana and Sponsor Couple programs offered through the Archdiocese of Galveston-Houston. Bilingual counselors serving Spanish-speaking couples are widely available in Bellaire, Gulfton, and across the city's west side.`,

      `Houston couples frequently enter premarital counseling wanting help with the Texas-sized practical questions: managing dual careers in the energy, medical, or aerospace industries, planning for Houston's unpredictable weather events (flooding, hurricanes) as a couple, navigating the sprawl of a city where partners might commute 45 minutes in opposite directions, and blending families and cultural traditions in one of America's most ethnically diverse metros.`
    ]
  },

  // ─────────────────────────────────────────────
  // 5. Dallas, TX
  // ─────────────────────────────────────────────
  'texas/dallas': {
    heading: 'Getting Married in Dallas',
    paragraphs: [
      `Dallas County marriage licenses are available through the County Clerk's office at the George Allen Courts Building downtown or at the satellite office in the Dallas County South Sub-Courthouse in DeSoto. Like all of Texas, there is a 72-hour waiting period — but completing a state-approved premarital education course waives that waiting period and reduces the fee from $81 to $21. The license is valid for 90 days, giving couples flexibility in planning their ceremony date.`,

      `The Dallas–Fort Worth metroplex is one of the largest wedding markets in the country. Uptown and the Design District are home to sleek modern venues and rooftop spaces with skyline views, while the Arts District offers options like the Nasher Sculpture Center garden. Highland Park and Preston Hollow cater to traditional, high-end celebrations at country clubs and estate properties. In Fort Worth — just 30 miles west — the Stockyards give couples a distinctly Texan backdrop, and the Fort Worth Botanic Garden is one of the most photographed ceremony sites in North Texas. For couples on a tighter budget, Deep Ellum's warehouses and Bishop Arts District's quirky gallery spaces offer character and affordability.`,

      `Dallas has a deeply rooted faith-based counseling culture, with many couples completing their premarital preparation through one of the area's large evangelical churches — Watermark Community Church, The Village Church, and Prestonwood Baptist Church all run structured multi-week premarital programs that are well-regarded. The Catholic Diocese of Dallas requires couples to complete a Pre-Cana or Engaged Encounter weekend before a church wedding. On the licensed therapist side, the Park Cities, Richardson, and Plano corridor has a strong concentration of LPCs and LMFTs trained in Prepare/Enrich assessments and Gottman-based frameworks. Many Dallas counselors also specialize in serving military couples, given the proximity to multiple military installations in the region.`,

      `Common themes in Dallas premarital counseling include managing the expectations that come with Texas's culture of large, expensive weddings, merging finances in a city with rising housing costs and no state income tax, handling the influence of close-knit families and church communities on the marriage, and discussing future plans around the sprawling suburbs where many DFW couples eventually settle to raise families.`
    ]
  },

  // ─────────────────────────────────────────────
  // 6. Austin, TX
  // ─────────────────────────────────────────────
  'texas/austin': {
    heading: 'Getting Married in Austin',
    paragraphs: [
      `Travis County marriage licenses are issued at the County Clerk's office at 5501 Airport Boulevard in Austin — not downtown, which catches some couples off guard. The same Texas-wide rules apply: a 72-hour waiting period that can be waived by completing a premarital education course, and a fee of $81 ($21 with the course). The office accepts appointments and walk-ins, and the license is good for 90 days throughout the state.`,

      `Austin's wedding culture is as eclectic as the city itself. Hill Country venues — ranches and vineyards in Dripping Springs, Wimberley, and Marble Falls — are the backbone of the Austin wedding market, offering live oak trees, limestone backdrops, and outdoor ceremonies that take advantage of Central Texas's long warm season. Within the city, couples choose from South Congress boutique hotels, East Austin art studios and brewery taprooms, the Umlauf Sculpture Garden, and historic downtown spaces like the Driskill Hotel. Lady Bird Lake and Mount Bonnell are popular for engagement photos, elopements, and small ceremonies. Austin's "Keep It Weird" ethos shows up in its weddings too — food trucks instead of caterers, live bands from the local music scene, and wildflower-themed décor are all common.`,

      `Austin's counseling community skews younger and more progressive than much of Texas. The city has a high concentration of licensed therapists who specialize in working with tech-industry couples, creative professionals, and LGBTQ+ partners. Many Austin counselors are trained in the Gottman Method, Emotionally Focused Therapy, or Internal Family Systems approaches. The University of Texas at Austin's counseling psychology program produces a steady pipeline of new clinicians. Faith-based options are available too — Austin Stone Community Church, Hill Country Bible Church, and several Catholic parishes offer structured premarital programs — but the city's secular counseling scene is notably stronger than in Dallas or Houston.`,

      `Austin couples bring a distinctive set of concerns to premarital counseling: the city's rapid growth and skyrocketing housing costs, deciding whether to stay in Austin or move as the cost of living rises, managing the stress of startup and tech careers that demand long hours, and maintaining a relationship identity in a city where social calendars fill up fast with festivals, live music, and outdoor activities. Good premarital counseling in Austin often includes honest conversations about lifestyle sustainability — making sure both partners can build a marriage that works when the honeymoon phase and the city's party culture settle down.`
    ]
  },

  // ─────────────────────────────────────────────
  // 7. San Francisco, CA
  // ─────────────────────────────────────────────
  'california/san-francisco': {
    heading: 'Getting Married in San Francisco',
    paragraphs: [
      `San Francisco County marriage licenses are issued at City Hall, one of the most beautiful government buildings in the country — and also one of the most popular wedding ceremony venues on the West Coast. The grand Beaux-Arts rotunda and sweeping marble staircase make City Hall a destination wedding spot in itself. Couples can obtain their license and marry in a civil ceremony on the same day, since California has no waiting period. The license fee is $109 for a standard license or $103 for a confidential license, and it's valid for 90 days. City Hall civil ceremonies are available by reservation and cost an additional $87.`,

      `Beyond City Hall, San Francisco's wedding venues lean into the city's dramatic natural setting. Golden Gate Park — especially the Conservatory of Flowers and the Shakespeare Garden — hosts outdoor ceremonies year-round, though summer fog is a real planning consideration. Baker Beach, Lands End, and Crissy Field offer jaw-dropping Golden Gate Bridge backdrops. The Presidio has multiple event spaces nestled in eucalyptus groves. For indoor options, couples look to SoMa's industrial lofts, North Beach Italian restaurants for intimate dinners, and Wine Country venues in Napa and Sonoma — an hour's drive north — for weekend destination celebrations.`,

      `San Francisco's premarital counseling community is progressive, highly credentialed, and shaped by the city's tech-driven, socially conscious culture. Many therapists here hold doctoral degrees and specialize in Emotionally Focused Therapy or psychodynamic approaches. The city has one of the highest concentrations of LGBTQ+-affirming premarital counselors in the country, reflecting San Francisco's history as a center of the marriage equality movement. The Pacific Heights, Marina, and Noe Valley neighborhoods have well-established therapy practices, while the Mission and Castro offer counselors who work specifically with queer couples, polyamorous partners, and non-traditional family structures. Interfaith and intercultural counseling is also a major niche, given the city's international population.`,

      `Financial stress is the number-one topic San Francisco couples bring to premarital counseling. With median home prices over $1.2 million and one-bedroom rents that can top $3,000, couples need practical plans for housing, savings, and whether homeownership is even realistic. Other common themes include managing dual tech careers with demanding schedules, processing political and social values as a couple, deciding whether to stay in the Bay Area long-term or relocate for affordability, and planning for parenthood in a city where childcare costs rival a second mortgage.`
    ]
  },

  // ─────────────────────────────────────────────
  // 8. Miami, FL
  // ─────────────────────────────────────────────
  'florida/miami': {
    heading: 'Getting Married in Miami',
    paragraphs: [
      `Miami-Dade County marriage licenses are available at the Clerk of Courts office downtown or at satellite locations in Coral Gables, Hialeah, and North Dade. Florida has no waiting period for couples who complete a premarital preparation course — without the course, there is a three-day waiting period. The license fee is $93.50 without the course or $61.50 with it, and the license is valid for 60 days. Florida also waives the waiting period entirely for couples who are both Florida residents and complete the premarital course, making it a meaningful financial and logistical incentive.`,

      `Miami is a year-round destination wedding market, drawing couples from across Latin America, the Caribbean, and the rest of the United States. South Beach oceanfront hotels, Brickell's rooftop terraces, and Coral Gables' historic Biltmore Hotel anchor the luxury end of the market. Coconut Grove and Vizcaya Museum & Gardens offer lush, tropical ceremony settings, while Key Biscayne and the Deering Estate provide waterfront elegance without the South Beach crowds. Wynwood's mural-lined warehouses have become a go-to for couples who want an arts-district vibe. Many Miami couples also plan destination-style weddings in the Florida Keys — just a two-hour drive south — for a more intimate, island feel.`,

      `Miami's premarital counseling landscape is shaped by its Latin American and Caribbean roots. Bilingual (English-Spanish) counseling is not a niche here — it's mainstream, and many of the city's top marriage therapists conduct sessions in both languages. Catholic Pre-Cana programs through the Archdiocese of Miami are the most common form of premarital preparation, reflecting the city's large Catholic population. Evangelical and nondenominational churches in Doral, Kendall, and Homestead also run active marriage preparation programs in English, Spanish, and Haitian Creole. On the licensed therapist side, Coral Gables and South Miami have a concentration of psychologists and LMFTs who work with bicultural couples navigating differences in family expectations, gender roles, and communication styles.`,

      `Miami couples often seek premarital counseling to address the complexities of multicultural marriages — differing expectations around family involvement, navigating immigration and documentation status, handling long-distance family ties across borders, and blending holiday traditions from different countries. Financial conversations are also front and center: Miami's housing market is volatile, the insurance landscape is challenging (hurricane and flood coverage), and the city's tourism-driven economy can create income instability for couples in hospitality and service industries.`
    ]
  },

  // ─────────────────────────────────────────────
  // 9. Atlanta, GA
  // ─────────────────────────────────────────────
  'georgia/atlanta': {
    heading: 'Getting Married in Atlanta',
    paragraphs: [
      `Fulton County marriage licenses are obtained at the Probate Court at 136 Pryor Street in downtown Atlanta. Georgia has no waiting period — couples can marry immediately after receiving their license. The fee is $56 for Georgia residents (both partners must be residents) or $66 for non-residents, and the license is valid for six months, one of the longest validity periods in the country. No blood test is required, and both partners must appear in person with valid photo ID.`,

      `Atlanta's wedding market is one of the most dynamic in the Southeast. Buckhead is the city's luxury wedding hub, with the St. Regis, Ritz-Carlton, and historic estates along Tuxedo Road hosting elegant receptions. Midtown offers arts-focused venues like the High Museum of Art and the Atlanta Botanical Garden, while Inman Park and Grant Park provide charming neighborhood settings in restored Victorian homes. Outside the Perimeter, Roswell, Marietta, and Alpharetta have a mix of rustic barn venues and modern event spaces. The city's strong African American cultural heritage shapes its wedding traditions — lavish receptions with live bands, jumping the broom ceremonies, and family-centered celebrations are defining features of many Atlanta weddings.`,

      `Atlanta is one of the strongest faith-based premarital counseling markets in the country. Many of the city's prominent African American churches — including Ebenezer Baptist Church, New Birth Missionary Baptist Church, and World Changers Church International — require premarital counseling before officiating a wedding and offer their own structured programs. The Catholic Archdiocese of Atlanta runs Pre-Cana and Sponsor Couple programs across multiple parishes. On the clinical side, Decatur, Virginia-Highland, and Sandy Springs have well-established therapy practices with counselors trained in Gottman, Prepare/Enrich, and Emotionally Focused Therapy. Emory University's relationship research has influenced many local clinicians, and the Atlanta area has a growing community of therapists who specialize in working with high-achieving Black couples and interracial partnerships.`,

      `Common premarital counseling themes for Atlanta couples include managing the fast pace of the city's corporate and entertainment industries, handling expectations from large Southern families, merging finances in a city experiencing rapid gentrification and rising housing costs, and discussing faith and church involvement in the marriage. Atlanta's counselors also frequently work with couples navigating the "Black Mecca" social scene — helping partners build a strong private foundation while living in a city with an active nightlife and social culture.`
    ]
  },

  // ─────────────────────────────────────────────
  // 10. Denver, CO
  // ─────────────────────────────────────────────
  'colorado/denver': {
    heading: 'Getting Married in Denver',
    paragraphs: [
      `Denver County marriage licenses are issued at the Denver Clerk and Recorder's office at the Wellington E. Webb Municipal Building downtown. Colorado stands out nationally for two things: there is no waiting period, and couples can legally self-solemnize their marriage — meaning you do not need an officiant, minister, or judge. You can marry yourselves. The license costs $30 and is valid for 35 days within the state. Both partners must appear in person, and you'll need valid government-issued photo ID.`,

      `Denver's wedding scene takes full advantage of Colorado's natural landscape. Mountain venues in Estes Park, Breckenridge, Vail, and Evergreen are the marquee draws for destination-style Colorado weddings — think aspen groves, alpine meadows, and ceremony backdrops that look like postcards. Within Denver itself, the RiNo Art District has converted warehouses and taproom venues with industrial character, Washington Park and Cheesman Park offer tree-lined urban settings, and LoDo (Lower Downtown) has rooftop venues with mountain views on clear days. The Denver Botanic Gardens and the Boettcher Mansion in Golden are perennial favorites. Self-solemnization has also made hiking elopements and mountaintop ceremonies a genuine trend — couples hike to a summit with a photographer and marry each other on the spot.`,

      `Denver's premarital counseling community reflects the city's outdoor-loving, health-conscious, and increasingly diverse population. The city has a strong concentration of licensed professional counselors (LPCs) and licensed marriage and family therapists (LMFTs), many of whom blend traditional therapeutic approaches with mindfulness and somatic techniques that fit Denver's wellness culture. Capitol Hill and Cherry Creek have well-established therapy practices, while the suburbs — Arvada, Littleton, and Aurora — have both clinical and church-based options. Colorado's evangelical Christian community is significant, and churches like Red Rocks Church, Flatirons Community Church, and Denver Community Church offer structured premarital programs. Catholic premarital preparation is available through the Archdiocese of Denver.`,

      `Denver couples typically bring a few recurring themes to premarital counseling: balancing adventure-oriented lifestyles (skiing, hiking, traveling) with the stability that marriage requires, managing the housing market in a city where prices have more than doubled over the past decade, navigating the legalization of recreational marijuana and differing views on substance use, and planning for the future in a city that attracts transplants from across the country — many of whom are far from extended family support networks.`
    ]
  },

  // ─────────────────────────────────────────────
  // 11. Phoenix, AZ
  // ─────────────────────────────────────────────
  'arizona/phoenix': {
    heading: 'Getting Married in Phoenix',
    paragraphs: [
      `Maricopa County marriage licenses are available at the Superior Court Clerk's office in downtown Phoenix and at several satellite locations in Mesa, Surprise, and other Valley cities. Arizona has no waiting period and no blood test requirement — your license is effective immediately and valid for 12 months, the longest validity window in the United States. The fee is $83, and both parties must appear in person with valid ID. Arizona also allows self-solemnization, so couples can officiate their own ceremony.`,

      `Phoenix and the greater Valley of the Sun offer a wedding landscape defined by desert beauty and year-round sunshine — with the critical caveat that summer ceremonies (June through September) require indoor or evening-only planning due to extreme heat. Scottsdale is the luxury wedding hub of the Valley, with resorts like the Fairmont Scottsdale Princess, the Phoenician, and the Four Seasons at Troon North drawing couples from across the region. Tempe's lakeside venues and downtown event spaces cater to younger couples, while Mesa and Gilbert offer more affordable options with desert garden settings. The Desert Botanical Garden in Papago Park, South Mountain Park, and the Superstition Mountains east of the Valley are popular for ceremony photos and outdoor celebrations during the cooler months (October through April).`,

      `Phoenix's premarital counseling market serves one of the fastest-growing metro areas in the country, and the counseling community has grown with it. North Scottsdale and Paradise Valley have a concentration of licensed therapists in private practice, many specializing in high-income and executive couples. The East Valley — Mesa, Chandler, and Gilbert — has a strong church-based counseling network, heavily influenced by the area's large LDS (Church of Jesus Christ of Latter-day Saints) population and its evangelical Christian community. Catholic premarital preparation is offered through the Diocese of Phoenix. Bilingual counseling in English and Spanish is widely available in South Phoenix, Maryvale, and throughout the West Valley, reflecting the region's large Latino population.`,

      `Phoenix-area couples often come to premarital counseling dealing with transition-related stress — many are transplants from other states who moved for jobs or affordability and are building a life far from family. Other common themes include planning around extreme seasonal weather (summers that limit outdoor social life), managing rapid suburban growth and long commutes across the sprawling Valley, and navigating interfaith marriages in a region where LDS, Catholic, evangelical, and secular backgrounds frequently intersect.`
    ]
  },

  // ─────────────────────────────────────────────
  // 12. Nashville, TN
  // ─────────────────────────────────────────────
  'tennessee/nashville': {
    heading: 'Getting Married in Nashville',
    paragraphs: [
      `Davidson County marriage licenses are issued at the County Clerk's office at 700 2nd Avenue South in downtown Nashville. Tennessee has no waiting period — your license is effective immediately — and it's valid for 30 days. The fee is $99.50, which includes a $60 state fee that is reduced by $60 if both partners complete a premarital preparation course approved by the state, bringing the total down to $39.50. Both applicants must appear in person with valid government-issued photo ID, and Tennessee requires couples to specify who will officiate the ceremony at the time of application.`,

      `Nashville has exploded as a wedding destination over the past decade, driven by the city's music scene, Southern charm, and a venue market that punches well above its weight. The Gulch and 12South are home to modern, design-forward venues, while East Nashville has an indie, artist-friendly wedding culture with converted houses and small music venues serving as reception spaces. Historic plantation homes like Belle Meade, Carnton, and Ravenswood Mansion draw couples who want a traditional Southern estate setting — though couples should research the histories of these properties and decide what aligns with their values. Downtown honky-tonks on Lower Broadway host rehearsal dinners and after-parties, and live country or bluegrass bands at receptions are a Nashville signature. The surrounding countryside — Franklin, Leiper's Fork, and the Natchez Trace Parkway — offers pastoral barn and farm venues.`,

      `Nashville's premarital counseling scene is deeply shaped by the city's Christian culture. The city is home to the Southern Baptist Convention, the United Methodist Publishing House, and dozens of influential evangelical churches — many of which require premarital counseling before they'll officiate a wedding. Churches like Cross Point, Christ Church Nashville, and Fellowship Bible Church run structured multi-week premarital programs that are among the most thorough in the country. Catholic premarital preparation is available through the Diocese of Nashville. On the clinical side, Green Hills, Berry Hill, and Brentwood have a growing number of licensed therapists in private practice who offer non-religious premarital counseling using Gottman, Prepare/Enrich, or Emotionally Focused Therapy frameworks. Nashville's counseling community has been growing rapidly to keep pace with the city's population boom.`,

      `Nashville couples often seek premarital counseling to navigate the tensions between the city's traditional roots and its rapid modernization. Common themes include managing expectations from religious families when one or both partners are less observant, handling the financial pressures of a city where the cost of living has risen sharply, building a social circle as transplants in a city that's grown by more than 100,000 people in the past decade, and grounding a relationship when one or both partners work in Nashville's music, healthcare, or hospitality industries — sectors with irregular hours and high burnout rates.`
    ]
  },

  // ─────────────────────────────────────────────
  // 13. San Diego, CA
  // ─────────────────────────────────────────────
  'california/san-diego': {
    heading: 'Getting Married in San Diego',
    paragraphs: [
      `San Diego County marriage licenses are issued at the County Clerk's office at 1600 Pacific Highway near the waterfront. Like the rest of California, there is no waiting period, and couples can choose between a standard public license ($70) or a confidential license ($70), which limits public access to the marriage record. The license is valid for 90 days. San Diego is also home to one of the few remaining counties that offers civil ceremonies directly through the clerk's office, though availability varies and appointments book up quickly during peak wedding season.`,

      `San Diego's wedding scene is defined by its coastline. Beach ceremonies at La Jolla Cove, Coronado Beach, and Sunset Cliffs are iconic — though beach weddings in San Diego require a no-cost permit from the city and come with rules about setup and group size. Balboa Park, with its Spanish Colonial architecture and immaculate gardens, is one of the most popular ceremony and photo locations in Southern California. The Gaslamp Quarter downtown offers urban rooftop venues with harbor views, while Mission Valley and Point Loma have more traditional hotel and garden options. North County — Del Mar, Carlsbad, and Rancho Santa Fe — caters to upscale outdoor celebrations, and Temecula wine country is a popular day-trip destination for vineyard ceremonies.`,

      `San Diego's premarital counseling community is influenced by the city's military presence, its proximity to the Mexican border, and its laid-back but family-oriented culture. The large military population — tied to Naval Base San Diego, Marine Corps Base Camp Pendleton, and several other installations — means many counselors here specialize in working with military couples, addressing deployment, relocation, and the unique stressors of military life. Bilingual counseling in English and Spanish is widely available, especially in Chula Vista, National City, and San Ysidro. The beach communities — Pacific Beach, Ocean Beach, and Encinitas — have therapists who cater to younger, active-lifestyle couples. Faith-based premarital programs are offered through the Diocese of San Diego (Catholic) and through large evangelical churches like The Rock Church and Maranatha Chapel.`,

      `San Diego couples commonly bring lifestyle and logistics questions to premarital counseling: managing the cost of living in a coastal city on military, biotech, or tourism-industry salaries; deciding whether to rent or buy in a housing market that's among the least affordable in the country; planning around military deployment cycles; and maintaining a relationship when one partner is from across the border in Tijuana or has family ties in Mexico. San Diego's counselors help couples build practical foundations beneath the city's sunshine-and-surf veneer.`
    ]
  },

  // ─────────────────────────────────────────────
  // 14. Seattle, WA
  // ─────────────────────────────────────────────
  'washington/seattle': {
    heading: 'Getting Married in Seattle',
    paragraphs: [
      `King County marriage licenses are available at the King County Recorder's office in the Administration Building downtown. Washington State requires a three-day waiting period between obtaining the license and the ceremony, though couples can apply for a waiver from a court if they have urgent circumstances. The license fee is $70, and it's valid for 60 days. Washington also allows couples to self-solemnize their marriages — you don't need an officiant — and the state was one of the first to legalize same-sex marriage by popular vote in 2012.`,

      `Seattle weddings embrace the Pacific Northwest aesthetic: lush greenery, mountain views, water, and wood. Venues along the Puget Sound — from Alki Beach in West Seattle to waterfront estates on Bainbridge Island — offer ceremony backdrops with the Olympic Mountains in the distance. The Olympic Sculpture Park, the Volunteer Park Conservatory on Capitol Hill, and the Washington Park Arboretum are popular for intimate ceremonies and photos. SoDo and Georgetown have converted industrial spaces with the kind of raw, creative atmosphere that appeals to Seattle's arts community. For couples willing to travel, the San Juan Islands and Leavenworth (a Bavarian-themed village in the Cascades) are top destination options within a few hours' drive. Rain is a real planning consideration — most Seattle wedding pros recommend a backup indoor option even for summer ceremonies.`,

      `Seattle's counseling community mirrors the city's progressive, tech-driven, and highly educated population. The city has one of the highest therapist-to-population ratios in the country, and premarital counseling is widely normalized. Capitol Hill, Fremont, and Ballard have dense concentrations of licensed mental health counselors (LMHCs) and marriage and family therapists who work with LGBTQ+ couples, polyamorous partners, and non-traditional families alongside more conventional couples. Many Seattle therapists integrate mindfulness, attachment theory, and somatic approaches. The Eastside — Bellevue, Redmond, Kirkland — has practices that cater to tech-industry couples dealing with high-stress, high-income dynamics. Faith-based premarital options are available but less dominant than in Southern or Midwestern cities, though Mars Hill's legacy and several thriving nondenominational churches still serve the faith-based market.`,

      `Seattle couples frequently enter premarital counseling with concerns about work-life balance in the tech industry (Amazon, Microsoft, Google, Meta all have major presences), managing wealth and stock-based compensation in ways that feel equitable, navigating seasonal depression during Seattle's dark, rainy winters, and deciding whether to stay in a city where housing prices have made homeownership a stretch even for six-figure earners. Premarital counseling in Seattle often includes frank conversations about mental health, career identity, and what it means to build a life together when both partners are ambitious professionals.`
    ]
  },

  // ─────────────────────────────────────────────
  // 15. Portland, OR
  // ─────────────────────────────────────────────
  'oregon/portland': {
    heading: 'Getting Married in Portland',
    paragraphs: [
      `Multnomah County marriage licenses are issued at the County Clerk's office at the Multnomah Building on SE Hawthorne Boulevard. Oregon has a three-day waiting period after the license is issued, and the fee is $60. The license is valid for 60 days and can be used anywhere in the state. Oregon does not require blood tests. One notable Oregon feature: the state allows couples to designate a "confidential" marriage, and ordained ministers, judges, or county clerks can all perform the ceremony.`,

      `Portland weddings lean into the city's independent, creative spirit. Forest Park and the Hoyt Arboretum offer old-growth woodland ceremony settings minutes from downtown. The Pearl District has modern gallery and loft venues, while Southeast Portland — Division, Hawthorne, and Alberta Arts District — is full of eclectic spaces like converted churches, craft breweries, and artist-owned event halls. McMenamins properties (Edgefield, Crystal Hotel, Kennedy School) are beloved Portland institutions that double as quirky, art-filled wedding venues. The Columbia River Gorge — 30 minutes east — provides dramatic waterfall and clifftop ceremony locations, and Oregon's Willamette Valley wine country is a premier destination for vineyard weddings. Portland couples often prioritize locally sourced catering, sustainable décor, and small-batch cocktails from local distilleries.`,

      `Portland's premarital counseling market is small-city intimate but highly skilled. The city has a strong community of licensed therapists who specialize in progressive, values-aligned counseling — LGBTQ+-affirming care is standard practice, not a specialty, across most Portland therapy offices. Many counselors here are trained in Emotionally Focused Therapy, narrative therapy, or the Developmental Model of couples therapy. The Division-Hawthorne corridor and the close-in Eastside neighborhoods have the highest concentration of practices. Faith-based options exist but are less prominent than in other metros — couples seeking Christian premarital counseling typically connect through churches like Bridgetown, Imago Dei, or Door of Hope, which offer structured programs rooted in community mentoring.`,

      `Portland couples often come to premarital counseling wanting to address financial planning in a city with rising costs but wages that haven't kept pace with Seattle or San Francisco, navigating political and social values (Portland's activist culture can create pressure on couples to align publicly on every issue), maintaining connection during long gray winters, and building shared goals when both partners may be creative professionals, freelancers, or small-business owners without the stability of corporate careers. Portland's counselors tend to take a holistic, low-pressure approach that fits the city's ethos — practical help without the corporate therapy feel.`
    ]
  },

  // ─────────────────────────────────────────────
  // 16. Charlotte, NC
  // ─────────────────────────────────────────────
  'north-carolina/charlotte': {
    heading: 'Getting Married in Charlotte',
    paragraphs: [
      `Mecklenburg County marriage licenses are obtained through the Register of Deeds at the Hal Marshall Annex in Uptown Charlotte. North Carolina has no waiting period — your license is effective immediately — and the fee is $60. The license is valid for 60 days, and both parties must appear in person. North Carolina is one of the few states that still requires two witnesses to sign the marriage license in addition to the officiant. No blood test is needed.`,

      `Charlotte's wedding market has grown rapidly alongside the city's population boom. Uptown's luxury hotels — the Ritz-Carlton, Kimpton Tryon Park, and the Westin — host polished receptions with city skyline views. The NoDa (North Davidson) arts district offers gallery and brewery venues with an industrial-creative feel, while South End has modern event spaces popular with younger professionals. Outside the city, Lake Norman to the north provides waterfront estate venues, and the Carolina countryside — Belmont, Waxhaw, and the foothills of the Blue Ridge Mountains — offers barn, farm, and vineyard settings. Charlotte's wedding culture blends Southern hospitality traditions (seated dinners, formal dress, extensive family involvement) with the cosmopolitan influences of a city that's become a major banking and corporate hub.`,

      `Charlotte's premarital counseling community reflects the city's dual identity as a traditional Southern city and a rapidly growing corporate center. The SouthPark and Myers Park neighborhoods have established therapy practices with counselors who work with banking and finance professionals dealing with high-pressure careers and relocation stress. The city's robust church network is a major source of premarital preparation — Elevation Church, Forest Hill Church, and Calvary Church all offer structured multi-week premarital programs, and the Catholic Diocese of Charlotte runs Pre-Cana and Engaged Encounter retreats. Charlotte's African American churches, especially in the West Charlotte and Beatties Ford Road corridor, have long-running marriage ministries that emphasize family and community support.`,

      `Charlotte couples frequently seek premarital counseling for issues tied to the city's growth: one or both partners relocated for work (banking, tech, healthcare) and are far from family support, managing dual corporate careers with demanding travel schedules, navigating the cultural differences that arise when a native Charlottean partners with someone from the Northeast or West Coast, and deciding where to buy a home in a metro that's rapidly sprawling into surrounding counties. Charlotte's counselors help couples anchor their marriage in a city that's changing fast.`
    ]
  },

  // ─────────────────────────────────────────────
  // 17. San Antonio, TX
  // ─────────────────────────────────────────────
  'texas/san-antonio': {
    heading: 'Getting Married in San Antonio',
    paragraphs: [
      `Bexar County marriage licenses are issued at the County Clerk's office in the Paul Elizondo Tower downtown. The Texas-wide rules apply: a 72-hour waiting period that's waived with a premarital education course, a fee of $81 ($21 with the course), and a 90-day validity window. San Antonio's clerk office also performs civil ceremonies on-site for an additional fee, making it convenient for couples who want a simple legal ceremony.`,

      `San Antonio is a city steeped in wedding tradition. The River Walk — the city's iconic network of walkways along the San Antonio River — is the heart of the city's event scene, with hotels and restaurants along the waterway hosting rehearsal dinners, ceremonies, and receptions. The historic missions (including The Alamo and Mission San José, a UNESCO World Heritage Site) provide ceremony settings with deep cultural and spiritual significance, particularly for Catholic couples. The Pearl District, a revitalized brewery complex on the north end of the River Walk, has become one of the most sought-after wedding venues in south-central Texas. Outside downtown, the Texas Hill Country — Boerne, Fredericksburg, and New Braunfels — is a major wedding destination with ranch, vineyard, and dance hall venues that draw from both San Antonio and Austin markets.`,

      `San Antonio's premarital counseling landscape is heavily influenced by its deep Catholic and Hispanic heritage. The Archdiocese of San Antonio operates one of the most comprehensive Catholic marriage preparation programs in the country, including Pre-Cana workshops, Sponsor Couple mentoring, and the mandatory NFP (Natural Family Planning) component required for Catholic weddings. The city's evangelical churches — Community Bible Church, Oak Hills Church, and Cornerstone Church — also run popular premarital programs. On the clinical side, the Alamo Heights, Stone Oak, and Medical Center areas have licensed therapists who offer evidence-based premarital counseling, many of whom are bilingual in English and Spanish. JBSA (Joint Base San Antonio), one of the largest military installations in the country, means military-focused couples counseling is also a significant specialty here.`,

      `San Antonio couples bring a mix of traditional and modern concerns to premarital counseling: blending Hispanic family traditions with evolving personal values, navigating the expectations of large extended families that are closely involved in wedding planning and married life, managing finances on military or public-sector salaries in a city that's more affordable than Austin or Dallas but seeing costs rise, and discussing faith compatibility when one partner is more religiously observant than the other. San Antonio's counselors are skilled at honoring cultural traditions while helping couples create a marriage that's genuinely their own.`
    ]
  },

  // ─────────────────────────────────────────────
  // 18. Boston, MA
  // ─────────────────────────────────────────────
  'massachusetts/boston': {
    heading: 'Getting Married in Boston',
    paragraphs: [
      `Boston marriage licenses are issued at Boston City Hall in Government Center. Massachusetts requires couples to file a "Notice of Intention of Marriage" and wait three days before the license is issued — one of the few states with this process. The fee is $50, and the license is valid for 60 days. Massachusetts was the first U.S. state to legalize same-sex marriage in 2004, and Boston City Hall has performed thousands of same-sex ceremonies since. Both parties must appear in person to file, and you'll need valid ID and your Social Security number.`,

      `Boston's wedding venues reflect the city's deep history and New England charm. Beacon Hill brownstones, Back Bay hotels (the Fairmont Copley Plaza, the Liberty Hotel in a converted jail), and waterfront venues along Boston Harbor set the tone for the city's wedding culture. The Boston Public Library's grand courtyard is one of the most photographed ceremony locations in the Northeast. Cambridge offers academic-flavored venues near Harvard and MIT, while the North End's Italian restaurants are favorites for intimate rehearsal dinners. Outside the city, Cape Cod, Martha's Vineyard, and Nantucket are premier summer wedding destinations, and the Berkshires in western Massachusetts draw fall foliage wedding crowds. Boston's seasons drive the wedding calendar — fall is peak season, winter weddings are common and cozy, and outdoor summer ceremonies contend with New England's unpredictable weather.`,

      `Boston's premarital counseling community benefits from the city's concentration of world-class universities and teaching hospitals. Many therapists here are affiliated with or trained through Harvard Medical School, Boston University, or the Massachusetts General Hospital couples research program. The city has an unusually high proportion of doctoral-level psychologists offering premarital work, along with a strong network of licensed mental health counselors. Brookline, Cambridge, and Newton have well-established practices, while South Boston and Dorchester are home to counselors who work with the city's Irish-American, African American, and immigrant communities. Catholic premarital preparation through the Archdiocese of Boston is widely used, and the city's significant Jewish population supports a network of rabbis and Jewish family service counselors who offer premarital guidance rooted in Jewish values and tradition.`,

      `Boston couples often enter premarital counseling navigating the pressures of academic and medical careers — residency schedules, tenure tracks, and research demands that leave little room for relationship maintenance. Other common themes include managing Boston's extreme cost of living (housing, childcare, and student loan debt), dealing with seasonal affective disorder during long New England winters, blending Boston "townie" and transplant backgrounds, and planning for a future in a city where many professionals cycle through for training and may not stay permanently. Boston's best premarital counselors help couples decide not just how to be married, but where — and build contingency plans for the career moves that may take them beyond Route 128.`
    ]
  },

  // ─────────────────────────────────────────────
  // 19. Philadelphia, PA
  // ─────────────────────────────────────────────
  'pennsylvania/philadelphia': {
    heading: 'Getting Married in Philadelphia',
    paragraphs: [
      `Philadelphia marriage licenses are issued at the Marriage License Bureau in City Hall — the same iconic building with the William Penn statue atop its tower. Pennsylvania requires a three-day waiting period after the license is issued before the ceremony can take place, and the fee is $90. The license is valid for 60 days. Pennsylvania is one of the few states that still recognizes self-uniting (Quaker) marriages, a reflection of the state's deep roots in the Religious Society of Friends — couples can legally marry without an officiant by signing the license themselves along with two witnesses.`,

      `Philadelphia offers a wedding market that pairs historic grandeur with a more accessible price point than New York or Boston. The city's collection of historic venues is unmatched on the East Coast — the Curtis Center, the Please Touch Museum in Memorial Hall, the Cescaphe Event Group's industrial-chic spaces, and Reading Terminal Market for rehearsal dinners all showcase Philly's architectural heritage. Rittenhouse Square hotels anchor the luxury market, while Old City and Northern Liberties provide loft and gallery options with exposed brick and character. The Philadelphia Art Museum's steps (yes, the Rocky steps) are a popular photo backdrop, and the Fairmount Park system offers outdoor ceremony settings along the Schuylkill River. The Main Line suburbs — Bryn Mawr, Wayne, Villanova — have estate and country club venues that draw from traditional Philadelphia society wedding culture. Brandywine Valley, just southwest of the city, offers garden and estate venues with a pastoral feel.`,

      `Philadelphia's premarital counseling landscape blends clinical rigor with strong community and faith-based traditions. The city has a large population of licensed professional counselors, clinical social workers, and psychologists, many trained at the University of Pennsylvania, Drexel, or Temple. The Rittenhouse, Center City, and Chestnut Hill neighborhoods have established therapy practices. Philadelphia's Catholic community is one of the most deeply rooted in the country, and the Archdiocese of Philadelphia's premarital preparation program — including Pre-Cana, Sponsor Couples, and the FOCCUS inventory — is a rite of passage for many marrying couples. The city's African American churches, especially in West and North Philadelphia, run marriage preparation ministries that emphasize mentorship and community support. Philadelphia also has a significant Jewish premarital counseling network, with organizations like Jewish Family and Children's Service offering couples programs.`,

      `Philadelphia couples bring practical, no-nonsense concerns to premarital counseling — it's a Philly thing. Common topics include managing finances in a city that's more affordable than its Northeast Corridor neighbors but still challenging on teacher, nurse, or city-worker salaries, navigating deeply rooted family and neighborhood identities (where you're from in Philly matters), handling the commuting stress of a couple where one partner works in Center City and the other in the suburbs or South Jersey, and planning for homeownership in a market that ranges from $150K rowhouses in Kensington to $2M homes on the Main Line.`
    ]
  },

  // ─────────────────────────────────────────────
  // 20. Minneapolis, MN
  // ─────────────────────────────────────────────
  'minnesota/minneapolis': {
    heading: 'Getting Married in Minneapolis',
    paragraphs: [
      `Hennepin County marriage licenses are available at the Government Center in downtown Minneapolis. Minnesota has a five-day waiting period after the license is issued — one of the longer waiting periods in the country — though couples can apply for a court order to waive it in special circumstances. The fee is $115, and the license is valid for six months. Minnesota was one of the first states to legalize same-sex marriage through the legislature in 2013. Both parties must appear in person with valid ID, and no blood test is required.`,

      `Minneapolis-St. Paul offers a wedding market shaped by lakes, parks, and Nordic-inspired elegance. The Chain of Lakes — Lake Harriet, Lake Calhoun (Bde Maka Ska), and Lake of the Isles — provide beautiful outdoor ceremony settings, and the Minneapolis Sculpture Garden at the Walker Art Center (home of the iconic Spoonbridge and Cherry) is a photographer's dream. The North Loop (Warehouse District) has industrial-chic venues, while the St. Paul Cathedral and the James J. Hill House offer historic grandeur. The Minnesota landscape drives a strong seasonal wedding culture: summer and early fall are peak season, with outdoor ceremonies at state park lodges, lakeside resorts, and farm venues in the surrounding countryside. Winter weddings are a genuine tradition in the Twin Cities, with cozy receptions at breweries, lodge-style venues, and candlelit church halls.`,

      `The Twin Cities have a strong and diverse premarital counseling community. The area's concentration of major healthcare systems (Mayo Clinic, Allina Health, Fairview) and universities (University of Minnesota, Bethel University, Northwestern Health Sciences) has produced a deep bench of licensed marriage therapists and psychologists. Uptown, Edina, and St. Louis Park have well-established practices, and the Twin Cities are home to several Gottman-trained master therapists. Minnesota's Lutheran and Catholic heritage drives a robust faith-based counseling market — the Archdiocese of Saint Paul and Minneapolis runs one of the most structured Pre-Cana programs in the Midwest, and large Lutheran congregations (ELCA and LCMS) offer premarital pastoral counseling as standard practice. The Twin Cities' growing Somali, Hmong, and East African communities have also created demand for culturally responsive counselors who understand the dynamics of immigrant and refugee families.`,

      `Minneapolis couples often bring weather-related lifestyle concerns to premarital counseling — long Minnesota winters genuinely impact relationships, and counselors here are experienced at helping couples plan for seasonal routines that maintain connection from November through April. Other common themes include managing the "Minnesota Nice" communication style that can mask real feelings, navigating dual-career households in a market that's a major hub for Fortune 500 companies (Target, UnitedHealth Group, 3M, General Mills), handling large Scandinavian and German-heritage family expectations around holidays and traditions, and building community as a couple in a metro area where social circles can feel established and hard to break into as newcomers.`
    ]
  }
}

export default CITY_HUB_CONTENT
