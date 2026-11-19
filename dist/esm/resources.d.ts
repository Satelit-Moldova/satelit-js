import { SatelitCore } from './core.js';
import type { ApiResponse, CallOptions, Transport } from './core.js';
import { ExportApi } from './export.js';
import { FeedHelpers } from './helpers.js';
import type * as T from './types.js';
export interface RatesHistoryParams {
    /** ISO currency code, such as EUR. */
    code: string;
    /** How many days back. Past the plan's history it is cut to it, and `meta.history_cut` says so. */
    days?: number;
}
export interface FuelStationsParams {
    /** A network's key, from `/fuel`. */
    network?: string;
    /** A district, as the registry writes it. */
    raion?: string;
    /** Page number. */
    page?: number;
}
export interface FuelHistoryParams {
    /** Which fuel. */
    fuel: "a95" | "diesel" | "lpg";
    /** A network's key, from `/fuel`. */
    network?: string;
    /** How many days back. Past the plan's history it is cut to it, and `meta.history_cut` says so. */
    days?: number;
}
export interface IndexesBasketParams {
    /** How many months back, up to 36. A month counts as 30 days here. */
    months?: number;
}
export interface IndexesMovesParams {
    /** How far back to compare. */
    days?: number;
}
export interface LawActsParams {
    /** Words or an act's number. */
    q?: string;
    /** An act type, such as lege or hotarare. */
    type?: string;
    /** A topic key, such as taxes. */
    topic?: string;
    /** An issuer's key, such as parlamentul. */
    issuer?: string;
    /** Only important acts. */
    important?: boolean;
    /** From this day, inclusive. */
    from?: string;
    /** To this day, inclusive. */
    to?: string;
    /** Page number. */
    page?: number;
}
export interface LawDigestsParams {
    /** How many days back, up to 90. */
    days?: number;
}
export interface NewsListParams {
    /** Only articles or only briefs. */
    kind?: "article" | "brief";
    /** A key from `/news/categories`. */
    category?: string;
    /** Only stories whose `regions` hold this key, from `/news/regions`. A region's parent does not take in its children. */
    region?: "global" | "chisinau" | "balti" | "nord" | "centru" | "sud" | "gagauzia" | "transnistria" | "diaspora";
    /** Only stories of this time of day. */
    slot?: "morning" | "noon" | "evening";
    /** Only stories at or above this gravity. */
    min_gravity?: number;
    /** From this day, inclusive. */
    from?: string;
    /** To this day, inclusive. */
    to?: string;
    /** Page number. */
    page?: number;
    /** Rows to a page. */
    per?: number;
}
export interface NewsNowParams {
    /** The reader's region, a key from `/news/regions`. Without it, stories for the whole country only. */
    region?: "global" | "chisinau" | "balti" | "nord" | "centru" | "sud" | "gagauzia" | "transnistria" | "diaspora";
    /** Ids of the cards already shown to this reader, comma separated, at most 100. */
    seen?: string | string[];
    /** How many hours back a story may have been published. */
    hours?: number;
    /** Cards in the answer. */
    per?: number;
}
export interface NewsSearchParams {
    /** What to look for, 2 to 100 characters. */
    q: string;
    /** Page number. */
    page?: number;
}
export interface NewsDayParams {
    /** Only stories at or above this gravity. */
    min_gravity?: number;
}
export interface NewsCommentsParams {
    /** `top`: likes, then newest. `new`: newest. `negative`, `positive`: only that sentiment, then likes. */
    sort?: "top" | "new" | "negative" | "positive";
    /** Only comments of this platform. */
    platform?: "facebook" | "tiktok" | "youtube" | "telegram" | "point" | "stiri";
    /** Only comments with at least this many likes. */
    min_likes?: number;
    /** Only comments judged not to insult or threaten. */
    no_toxic?: boolean;
    /** Page number. */
    page?: number;
    /** Rows to a page. */
    per?: number;
}
export interface NewsEventsListParams {
    /** A key from `/news/categories`. */
    category?: string;
    /** Only events whose `regions` hold this key, from `/news/regions`. */
    region?: "global" | "chisinau" | "balti" | "nord" | "centru" | "sud" | "gagauzia" | "transnistria" | "diaspora";
    /** Only events of this time of day. */
    slot?: "morning" | "noon" | "evening";
    /** Only events at or above this gravity. */
    min_gravity?: number;
    /** True: only events known from public pages alone. False: only events an outlet reported too. */
    social_only?: boolean;
    /** Only events whose `reaction.label` is this. An event with too few comments for a label matches none. */
    sentiment?: "negative" | "mixed" | "positive";
    /** From this day, inclusive. */
    from?: string;
    /** To this day, inclusive. */
    to?: string;
    /** Also events that are not about Moldova, advertising or bulletins. */
    all?: boolean;
    /** Page number. */
    page?: number;
    /** Rows to a page. */
    per?: number;
}
export interface NewsEventsCommentsParams {
    /** `top`: likes, then newest. `new`: newest. `negative`, `positive`: only that sentiment, then likes. */
    sort?: "top" | "new" | "negative" | "positive";
    /** Only comments of this platform. */
    platform?: "facebook" | "tiktok" | "youtube" | "telegram" | "point" | "stiri";
    /** Only comments with at least this many likes. */
    min_likes?: number;
    /** Only comments judged not to insult or threaten. */
    no_toxic?: boolean;
    /** Page number. */
    page?: number;
    /** Rows to a page. */
    per?: number;
}
export interface PlacesListParams {
    /** Shops or places to go. */
    kind?: "shop" | "venue";
    /** A city's key, such as chisinau. */
    city?: string;
    /** A chain's key. */
    chain?: string;
    /** A category, such as supermarket or cafe. */
    category?: string;
    /** A point: latitude,longitude. */
    near?: string;
    /** Metres around `near`, up to 20000. */
    radius?: number;
    /** `chains` for the shops the chains publish themselves, read from their sites, with no agreement. Without it, OpenStreetMap's only. */
    source?: "osm" | "chains";
    /** Page number. */
    page?: number;
}
export interface PricesSearchParams {
    /** What to look for, 2 to 100 characters. */
    q: string;
    /** A shop's category key. */
    category?: string;
    /** Only this shop's offers, by its key. */
    store?: string;
    /** Only what is, or only what is not, in stock. */
    in_stock?: boolean;
    /** Page number. Stops at 5. */
    page?: number;
}
export interface PricesGroupsParams {
    /** A category key, such as dairy_eggs. */
    category?: string;
}
export interface PricesItemHistoryParams {
    /** How many days back. Past the plan's history it is cut to it, and `meta.history_cut` says so. */
    days?: number;
    /** Only this shop, by its key. */
    store?: string;
}
export interface DealsListParams {
    /** A category key. */
    category?: string;
    /** Only this shop, by its key. */
    store?: string;
    /** Page number. Stops at 5. */
    page?: number;
}
export interface ToursListParams {
    /** A country, as `/tours/countries` lists it. */
    country?: string;
    /** From this day, inclusive. */
    from?: string;
    /** To this day, inclusive. */
    to?: string;
    /** At least this many nights. */
    nights_min?: number;
    /** At most this many nights. */
    nights_max?: number;
    /** A board code, such as AI. */
    board?: string;
    /** An agency's key or name. */
    agency?: string;
    /** The order. */
    sort?: "price" | "date";
    /** Page number. Stops at 5. */
    page?: number;
}
export interface FlightsBoardParams {
    /** Which way. */
    kind?: "departures" | "arrivals";
    /** The day, today by default. */
    day?: string;
}
export interface RestListParams {
    /** A district's key or label. */
    region?: string;
    /** A kind of place, such as base or cabin. */
    kind?: string;
    /** Page number. Stops at 5. */
    page?: number;
}
export interface EstateGetParams {
    /** How many days back. Past the plan's history it is cut to it, and `meta.history_cut` says so. */
    days?: number;
}
export interface PowerDayParams {
    /** A delivery day, YYYY-MM-DD. */
    date?: string;
}
export interface PowerHistoryParams {
    /** How many days back. Past the plan's history it is cut to it, and `meta.history_cut` says so. */
    days?: number;
    /** Each day's hourly prices too. */
    hours?: boolean;
}
export interface PowerBilateralParams {
    /** How many days back. Past the plan's history it is cut to it, and `meta.history_cut` says so. */
    days?: number;
}
export interface MarketPricesParams {
    /** A subcategory id, from `/market/categories`. */
    category?: number;
    /** A city, as the ads write it, such as Chișinău. */
    city?: string;
    /** Page number. Stops at 200. */
    page?: number;
}
export interface MarketHistoryParams {
    /** A subcategory id, or 0 for the whole market. */
    category?: number;
    /** A city, as the ads write it. */
    city?: string;
    /** How many days back. Past the plan's history it is cut to it. */
    days?: number;
}
export interface MarketSellersParams {
    /** A subcategory id to rank within, from `/market/categories`. */
    category?: number;
    /** Only sellers newly listed. */
    new?: boolean;
    /** Page number. Stops at 200. */
    page?: number;
}
export interface FeedListParams {
    /** The `meta.next` of the last answer. Without it, from the oldest event kept. */
    after?: string;
    /** A comma list of event types. */
    types?: string | string[];
    /** Events to an answer. */
    limit?: number;
}
export interface JokesListParams {
    /** Words of the joke, a topic or a character, in any language, 2 to 100 characters. */
    q?: string;
    /** Only jokes with this topic, a key from `/jokes/topics`. */
    topic?: "family" | "couples" | "kids" | "school" | "work" | "doctors" | "police" | "animals" | "money" | "drinking" | "food" | "tech" | "travel" | "sport" | "old_age" | "mother_in_law" | "neighbours" | "village" | "army" | "law" | "religion" | "politics" | "bula" | "ion_maria" | "blondes" | "regions" | "wordplay" | "dark" | "other";
    /** Only this kind. */
    kind?: "joke" | "riddle" | "proverb" | "quote";
    /** Who will hear it. `kids`: fit for a child (under 12), up to `max_age` (6 without it). `family`: fit for a child, read out to the whole family. `general` (default): no 18+. `adult`: 18+ too. A joke mocking a people is in `general` and `adult`: leave it out with `exclude_flags=ethnic`. */
    audience?: "kids" | "family" | "general" | "adult";
    /** Only jokes that suit a listener this young: `min_age` at or under it. */
    max_age?: number;
    /** Only jokes at or above this score (0-100, how funny). Without it 40 for `kids`, 50 for the rest. */
    min_score?: number;
    /** A comma list of flags to leave out, such as `alcohol,politics`. */
    exclude_flags?: string | string[];
    /** Page number. */
    page?: number;
    /** Rows to a page. */
    per?: number;
}
export interface JokesTodayParams {
    /** The day's joke of this topic. */
    topic?: "family" | "couples" | "kids" | "school" | "work" | "doctors" | "police" | "animals" | "money" | "drinking" | "food" | "tech" | "travel" | "sport" | "old_age" | "mother_in_law" | "neighbours" | "village" | "army" | "law" | "religion" | "politics" | "bula" | "ion_maria" | "blondes" | "regions" | "wordplay" | "dark" | "other";
}
export interface JokesRandomParams {
    /** Only jokes with this topic, a key from `/jokes/topics`. */
    topic?: "family" | "couples" | "kids" | "school" | "work" | "doctors" | "police" | "animals" | "money" | "drinking" | "food" | "tech" | "travel" | "sport" | "old_age" | "mother_in_law" | "neighbours" | "village" | "army" | "law" | "religion" | "politics" | "bula" | "ion_maria" | "blondes" | "regions" | "wordplay" | "dark" | "other";
    /** Only this kind. */
    kind?: "joke" | "riddle" | "proverb" | "quote";
    /** Who will hear it. `kids`: fit for a child (under 12), up to `max_age` (6 without it). `family`: fit for a child, read out to the whole family. `general` (default): no 18+. `adult`: 18+ too. A joke mocking a people is in `general` and `adult`: leave it out with `exclude_flags=ethnic`. */
    audience?: "kids" | "family" | "general" | "adult";
    /** Only jokes that suit a listener this young: `min_age` at or under it. */
    max_age?: number;
    /** Only jokes at or above this score (0-100, how funny). Without it 40 for `kids`, 50 for the rest. */
    min_score?: number;
    /** A comma list of flags to leave out, such as `alcohol,politics`. */
    exclude_flags?: string | string[];
    /** Ids already shown to this user, comma separated, at most 200. */
    seen?: string | string[];
}
export interface JokesTopicsParams {
    /** Who will hear it. `kids`: fit for a child (under 12), up to `max_age` (6 without it). `family`: fit for a child, read out to the whole family. `general` (default): no 18+. `adult`: 18+ too. A joke mocking a people is in `general` and `adult`: leave it out with `exclude_flags=ethnic`. */
    audience?: "kids" | "family" | "general" | "adult";
}
export interface CourtsSearchParams {
    /** A name, a company, a case number or a PIGD, 2 to 80 characters. */
    q: string;
    /** A court or seat: its slug from `/courts/courts`, or its name in any language. */
    court?: string;
    /** Only this category. */
    kind?: "civil" | "penal" | "contrav" | "admin" | "other";
    /** Rows, at most 50. */
    per?: number;
}
export interface CourtsHearingsParams {
    /** A court or seat: its slug from `/courts/courts`, or its name in any language. */
    court?: string;
    /** today, tomorrow (the next working day) or YYYY-MM-DD. */
    date?: string;
    /** Only this category. */
    kind?: "civil" | "penal" | "contrav" | "admin" | "other";
    /** Only the hearings of the cases whose parties hold every word of this name, in any order: one name's agenda of the day. */
    q?: string;
    /** The `next` of the previous answer. */
    after?: number;
    /** Rows, at most 100. */
    per?: number;
}
export interface CourtsCaseParams {
    /** The case number, its PIGD or its page link on satelit.md. */
    number: string;
    /** A court or seat: its slug from `/courts/courts`, or its name in any language. */
    court?: string;
}
export interface CourtsNameParams {
    /** A court or seat: its slug from `/courts/courts`, or its name in any language. */
    court?: string;
    /** a: as plaintiff, b: as defendant, alone: the only party. */
    side?: "a" | "b" | "alone";
    /** The year the case was registered (or first heard). */
    year?: number;
    /** open, or decided (a decision or a decision day). */
    status?: "open" | "decided";
    /** Only this category. */
    type?: "civil" | "penal" | "contrav" | "admin" | "other";
    /** Page number. Stops at 50. */
    page?: number;
    /** Rows, at most 50. */
    per?: number;
}
export interface CourtsStatsParams {
    /** now, trends, judges or durations. */
    view?: "now" | "trends" | "judges" | "durations";
    /** A court or seat: its slug from `/courts/courts`, or its name in any language. */
    court?: string;
    /** Only this category. */
    kind?: "civil" | "penal" | "contrav" | "admin" | "other";
    /** judges: today, tomorrow, week, month, 30d (the last 30 days) or year (the last 365 days). */
    period?: "today" | "tomorrow" | "week" | "month" | "30d" | "year";
    /** trends: the window in days. */
    days?: number;
    /** judges: how many. */
    limit?: number;
}
export interface CitizenshipLookupParams {
    /** The dossier or order number as written, 3 to 80 characters. */
    q: string;
}
export interface CitizenshipStatsParams {
    /** Only this article of Romania's citizenship law: `11` (most dossiers), `10`, `8` or `8.1`. */
    article?: "11" | "10" | "8" | "8.1";
    /** The month a dossier was filed, `YYYY-MM`: adds its estimate. */
    month?: string;
}
export interface CitizenshipYearParams {
    /** Dossiers after this number. */
    after?: number;
    /** Dossiers to a page. */
    limit?: number;
}
export interface CitizenshipOrdersParams {
    /** Only this article of Romania's citizenship law: `11` (most dossiers), `10`, `8` or `8.1`. */
    article?: "11" | "10" | "8" | "8.1";
    /** From this day, inclusive. */
    from?: string;
    /** To this day, inclusive. */
    to?: string;
    /** The `next` of the page before. */
    before?: string;
    /** Orders to a page. */
    limit?: number;
}
export interface CitizenshipOrderParams {
    /** Rows after this `seq`. */
    after?: number;
    /** Rows to a page. */
    limit?: number;
}
export interface CompaniesSearchParams {
    /** A name (2 to 80 characters) or the first 5 or more digits of an IDNO. */
    q: string;
    /** Only this town, as the register writes it. */
    city?: string;
    /** Only this legal form: SRL, SA, ÎS, ÎM, OCN... */
    form?: string;
    /** true: only active companies; false: liquidated or in liquidation. The register's word. */
    active?: boolean;
    /** Only this field (`sectors[].key` of `/companies/stats`). */
    sector?: string;
    /** Only this CAEM-2 class, such as 47.11. */
    klass?: string;
    /** best (the best known first), new, old (by registration), won (by contracts won), name. */
    sort?: "best" | "new" | "old" | "won" | "name";
    /** Page number. Stops at 5. */
    page?: number;
    /** Rows, at most 50. */
    per?: number;
}
export interface CompaniesLicencesParams {
    /** true: only active entries; false: suspended, in liquidation or struck off. */
    active?: boolean;
    /** A word of the name, or an IDNO. */
    q?: string;
    /** Page number. Stops at 200. */
    page?: number;
}
export interface CompaniesNoticesParams {
    /** Only this kind. */
    kind?: "name" | "address" | "liquidating" | "liquidated";
    /** From this day, inclusive. */
    from?: string;
    /** To this day, inclusive. */
    to?: string;
    /** Page number. Stops at 200. */
    page?: number;
}
export interface CompaniesContractsParams {
    /** Page number. Stops at 20. */
    page?: number;
}
export interface DeliveryTermsParams {
    /** A town's key from `cities` (chisinau, balti...). */
    city?: string;
}
export interface InsuranceTariffsParams {
    /** The day the tariff in force is read for, YYYY-MM-DD (default today). */
    on?: string;
    /** Vehicle category code, such as 13 (a car of 1,601-2,000 cm³). */
    category?: string;
    /** 1: Chișinău and its ring of districts; 2: elsewhere. */
    zone?: "1" | "2";
    /** pf: a person; pj: a company. */
    holder?: "pf" | "pj";
    /** Age and experience class. */
    k4?: "young_new" | "young_exp" | "adult_new" | "adult_exp";
    /** The class in the bonus-malus system, such as 7. */
    bm?: string;
    /** Months of cover, 1 to 12. */
    months?: number;
}
export interface GeoSearchParams {
    /** The address, 3 to 200 characters. */
    q: string;
    /** The town, when the text does not say. */
    city?: string;
}
export interface GeoStreetsParams {
    /** A street's name, 2 to 120 characters. */
    q: string;
    /** lat,lon in Moldova. */
    near?: string;
    /** Metres around `near`, 100 to 50,000. */
    radius?: number;
    /** Page number. Stops at 40. */
    page?: number;
}
export interface MoviesSearchParams {
    /** A title or a name, 1 to 120 characters. */
    q: string;
    /** Which kind. */
    kind?: "all" | "movie" | "series" | "person";
    /** A film's year or a series' first year. */
    year?: number;
    /** Page number. Stops at 50. */
    page?: number;
}
export interface MoviesShowtimesParams {
    /** A two-letter country code. */
    country?: string;
}
export interface MoviesDiscoverParams {
    /** Films or series. */
    kind?: "movie" | "series";
    /** A genre id from `/movies/genres`, or its name, such as `comedie` or `комедия`. */
    genre?: string;
    /** One year. */
    year?: number;
    /** From this year. */
    year_from?: number;
    /** To this year. */
    year_to?: number;
    /** Country of origin, two letters. */
    country?: string;
    /** Original language, two letters, such as `ro`. */
    language?: string;
    /** Order. */
    sort?: "popular" | "rating" | "newest" | "votes";
    /** At least this many votes. */
    min_votes?: number;
    /** Page number. Stops at 50. */
    page?: number;
}
export interface MoviesTrendingParams {
    /** Which kind. */
    kind?: "all" | "movie" | "series" | "person";
    /** Today or this week. */
    window?: "day" | "week";
    /** Page number. Stops at 20. */
    page?: number;
}
export interface MoviesInCinemasParams {
    /** A two-letter country code. */
    country?: string;
    /** Now or next. */
    when?: "now" | "next";
    /** Page number. Stops at 20. */
    page?: number;
}
export interface MoviesGenresParams {
    /** Films or series. */
    kind?: "movie" | "series";
}
export interface MoviesCinemasParams {
    /** A two-letter country code. */
    country?: string;
    /** Only this city, such as Chișinău or Balti. */
    city?: string;
}
export interface MoviesCinemaScheduleParams {
    /** One day, the cinema's local date. Without it: from today on. */
    date?: string;
}
export interface MoviesTodayParams {
    /** A two-letter country code. */
    country?: string;
    /** Only this city. */
    city?: string;
    /** One day, the cinema's local date. Without it: from today on. */
    date?: string;
}
/** Official exchange rates (BNM) */
export declare class RatesApi {
    private readonly c;
    constructor(c: Transport);
    /** Official exchange rates. Costs 1 credit. `GET /rates` */
    readonly list: (opts?: CallOptions) => Promise<ApiResponse<T.Rate[]>>;
    /** History of one rate. Costs 1 credit per started 30 days. `GET /rates/history` */
    readonly history: (params: RatesHistoryParams, opts?: CallOptions) => Promise<ApiResponse<T.RateHistory>>;
}
/** Fuel prices (ANRE caps, networks, stations) */
export declare class FuelApi {
    private readonly c;
    constructor(c: Transport);
    /** Fuel prices today. Costs 1 credit. `GET /fuel` */
    readonly today: (opts?: CallOptions) => Promise<ApiResponse<T.FuelBoard>>;
    /** Fuel stations. Costs 5 credits per page. `GET /fuel/stations` */
    readonly stations: (params?: FuelStationsParams, opts?: CallOptions) => Promise<ApiResponse<T.Station[]>>;
    /** History of a fuel price. Costs 2 credits per started 30 days. `GET /fuel/history` */
    readonly history: (params: FuelHistoryParams, opts?: CallOptions) => Promise<ApiResponse<T.FuelHistory>>;
}
/** Household tariffs (ANRE) */
export declare class TariffsApi {
    private readonly c;
    constructor(c: Transport);
    /** Household tariffs. Costs 1 credit. `GET /tariffs` */
    readonly list: (opts?: CallOptions) => Promise<ApiResponse<T.Tariff[]>>;
}
/** Basket and price moves */
export declare class IndexesApi {
    private readonly c;
    constructor(c: Transport);
    /** The basket index. Costs per day, across shops, with no shop named. `GET /indexes/basket` */
    readonly basket: (params?: IndexesBasketParams, opts?: CallOptions) => Promise<ApiResponse<T.Basket>>;
    /** What got cheaper or dearer. Costs 2 credits. `GET /indexes/moves` */
    readonly moves: (params?: IndexesMovesParams, opts?: CallOptions) => Promise<ApiResponse<T.Moves>>;
}
/** Laws and official acts */
export declare class LawApi {
    private readonly c;
    constructor(c: Transport);
    /** Search legal acts. Costs 3 credits with `q`, else 2. `GET /law/acts` */
    readonly acts: (params?: LawActsParams, opts?: CallOptions) => Promise<ApiResponse<T.ActBrief[]>>;
    /** One legal act. Costs 1 credit. `GET /law/acts/{id}` */
    readonly act: (id: string, opts?: CallOptions) => Promise<ApiResponse<T.Act>>;
    /** The latest daily digests. Costs 2 credits. `GET /law/digests` */
    readonly digests: (params?: LawDigestsParams, opts?: CallOptions) => Promise<ApiResponse<T.DigestRow[]>>;
    /** One day's digest. Costs 2 credits. `GET /law/digests/{date}` */
    readonly digest: (date: string, opts?: CallOptions) => Promise<ApiResponse<T.Digest>>;
}
/** News stories */
export declare class NewsApi {
    private readonly c;
    readonly events: NewsEventsApi;
    constructor(c: Transport);
    /** News, newest first. Costs 2 credits. `GET /news` */
    readonly list: (params?: NewsListParams, opts?: CallOptions) => Promise<ApiResponse<T.NewsCard[]>>;
    /** What to show one reader now. Costs 2 credits. `GET /news/now` */
    readonly now: (params?: NewsNowParams, opts?: CallOptions) => Promise<ApiResponse<T.NewsCard[]>>;
    /** Search news. Costs 3 credits. `GET /news/search` */
    readonly search: (params: NewsSearchParams, opts?: CallOptions) => Promise<ApiResponse<T.NewsCard[]>>;
    /** One day of news. Costs 10 credits. `GET /news/days/{date}` */
    readonly day: (date: string, params?: NewsDayParams, opts?: CallOptions) => Promise<ApiResponse<T.NewsDay>>;
    /** News categories. Costs 1 credit. `GET /news/categories` */
    readonly categories: (opts?: CallOptions) => Promise<ApiResponse<T.Category[]>>;
    /** News regions and times of day. Costs 1 credit. `GET /news/regions` */
    readonly regions: (opts?: CallOptions) => Promise<ApiResponse<T.NewsRegions>>;
    /** The outlets we read. Costs 1 credit. `GET /news/outlets` */
    readonly outlets: (opts?: CallOptions) => Promise<ApiResponse<T.NewsOutlet[]>>;
    /** One story. Costs 1 credit. `GET /news/{id}` */
    readonly get: (id: string, opts?: CallOptions) => Promise<ApiResponse<T.NewsStory>>;
    /** Reaction of a story. Costs 1 credit. `GET /news/{id}/reaction` */
    readonly reaction: (id: string, opts?: CallOptions) => Promise<ApiResponse<T.StoryReaction>>;
    /** Comments on a story. Costs 3 credits. `GET /news/{id}/comments` */
    readonly comments: (id: string, params?: NewsCommentsParams, opts?: CallOptions) => Promise<ApiResponse<T.NewsComment[]>>;
}
/** News events and reactions */
export declare class NewsEventsApi {
    private readonly c;
    constructor(c: Transport);
    /** News events with reaction. Costs 2 credits. `GET /news/events` */
    readonly list: (params?: NewsEventsListParams, opts?: CallOptions) => Promise<ApiResponse<T.EventCard[]>>;
    /** One news event. Costs 1 credit. `GET /news/events/{id}` */
    readonly get: (id: string, opts?: CallOptions) => Promise<ApiResponse<T.EventDetail>>;
    /** Comments on a news event. Costs 3 credits. `GET /news/events/{id}/comments` */
    readonly comments: (id: string, params?: NewsEventsCommentsParams, opts?: CallOptions) => Promise<ApiResponse<T.NewsComment[]>>;
}
/** Shops and places to go */
export declare class PlacesApi {
    private readonly c;
    constructor(c: Transport);
    /** Shops and places from OpenStreetMap. Costs 2 credits per page. `GET /places` */
    readonly list: (params?: PlacesListParams, opts?: CallOptions) => Promise<ApiResponse<T.Place[]>>;
}
/** Recipes with today's cost */
export declare class RecipesApi {
    private readonly c;
    constructor(c: Transport);
    /** Recipes with today's cost. Costs at today's prices: one total, no shop behind it. `GET /recipes` */
    readonly list: (opts?: CallOptions) => Promise<ApiResponse<T.RecipeCard[]>>;
    /** One recipe. Costs 1 credit. `GET /recipes/{slug}` */
    readonly get: (slug: string, opts?: CallOptions) => Promise<ApiResponse<T.Recipe>>;
}
/** Shop prices */
export declare class PricesApi {
    private readonly c;
    constructor(c: Transport);
    /** Shops with prices. Costs 1 credit. `GET /prices/stores` */
    readonly stores: (opts?: CallOptions) => Promise<ApiResponse<T.PriceStore[]>>;
    /** Search products and prices. Costs 3 credits. `GET /prices/search` */
    readonly search: (params: PricesSearchParams, opts?: CallOptions) => Promise<ApiResponse<T.PriceItem[]>>;
    /** Staple products. Costs 2 credits. `GET /prices/groups` */
    readonly groups: (params?: PricesGroupsParams, opts?: CallOptions) => Promise<ApiResponse<T.PriceGroup[]>>;
    /** One staple and its offers. Costs 3 credits. `GET /prices/groups/{id}` */
    readonly group: (id: string, opts?: CallOptions) => Promise<ApiResponse<T.PriceGroupDetail>>;
    /** One product and its offers. Costs 2 credits. `GET /prices/items/{id}` */
    readonly item: (id: number | string, opts?: CallOptions) => Promise<ApiResponse<T.PriceItemDetail>>;
    /** Price history of a product. Costs 5 credits per started 30 days. `GET /prices/items/{id}/history` */
    readonly itemHistory: (id: number | string, params?: PricesItemHistoryParams, opts?: CallOptions) => Promise<ApiResponse<T.PriceHistory>>;
}
/** Discounts in shops */
export declare class DealsApi {
    private readonly c;
    constructor(c: Transport);
    /** Current deals. Costs 5 credits per page. `GET /deals` */
    readonly list: (params?: DealsListParams, opts?: CallOptions) => Promise<ApiResponse<T.Deal[]>>;
}
/** Tours from Moldovan agencies */
export declare class ToursApi {
    private readonly c;
    constructor(c: Transport);
    /** Package tours. Costs 3 credits per page. `GET /tours` */
    readonly list: (params?: ToursListParams, opts?: CallOptions) => Promise<ApiResponse<T.Tour[]>>;
    /** Countries with tours. Costs 1 credit. `GET /tours/countries` */
    readonly countries: (opts?: CallOptions) => Promise<ApiResponse<T.TourCountry[]>>;
    /** One tour and its price history. Costs on each day we saw it. `GET /tours/{id}` */
    readonly get: (id: number | string, opts?: CallOptions) => Promise<ApiResponse<T.TourDetail>>;
}
/** Flights from Chisinau */
export declare class FlightsApi {
    private readonly c;
    constructor(c: Transport);
    /** Destinations from Chisinau. Costs 2 credits. `GET /flights/destinations` */
    readonly destinations: (opts?: CallOptions) => Promise<ApiResponse<T.Destination[]>>;
    /** One destination. Costs 3 credits. `GET /flights/destinations/{code}` */
    readonly destination: (code: string, opts?: CallOptions) => Promise<ApiResponse<T.DestinationDetail>>;
    /** The airport's board. Costs 2 credits. `GET /flights/board` */
    readonly board: (params?: FlightsBoardParams, opts?: CallOptions) => Promise<ApiResponse<T.Board>>;
}
/** Rest places in Moldova */
export declare class RestApi {
    private readonly c;
    constructor(c: Transport);
    /** Places to rest in Moldova. Costs 3 credits per page. `GET /rest` */
    readonly list: (params?: RestListParams, opts?: CallOptions) => Promise<ApiResponse<T.RestPlace[]>>;
}
/** Real-estate price series */
export declare class EstateApi {
    private readonly c;
    constructor(c: Transport);
    /** Apartment prices. Costs 3 credits. `GET /estate` */
    readonly get: (params?: EstateGetParams, opts?: CallOptions) => Promise<ApiResponse<T.Estate>>;
}
/** Electricity exchange (day-ahead market) */
export declare class PowerApi {
    private readonly c;
    constructor(c: Transport);
    /** The power exchange, one day by hour. Costs 1 credit. `GET /power` */
    readonly day: (params?: PowerDayParams, opts?: CallOptions) => Promise<ApiResponse<T.PowerDay>>;
    /** History of the power exchange. Costs 2 credits per started 30 days. `GET /power/history` */
    readonly history: (params?: PowerHistoryParams, opts?: CallOptions) => Promise<ApiResponse<T.PowerHistory>>;
    /** Bilateral contracts on the exchange. Costs 1 credit. `GET /power/bilateral` */
    readonly bilateral: (params?: PowerBilateralParams, opts?: CallOptions) => Promise<ApiResponse<T.PowerBilateral>>;
}
/** Classifieds market data (aggregates) */
export declare class MarketApi {
    private readonly c;
    constructor(c: Transport);
    /** Classifieds market categories. Costs 2 credits. `GET /market/categories` */
    readonly categories: (opts?: CallOptions) => Promise<ApiResponse<T.MarketCategory[]>>;
    /** Classifieds prices and volume. Costs 2 credits per 50 rows. `GET /market/prices` */
    readonly prices: (params?: MarketPricesParams, opts?: CallOptions) => Promise<ApiResponse<T.MarketPrice[]>>;
    /** Classifieds market over time. Costs 3 credits per started 30 days. `GET /market/history` */
    readonly history: (params?: MarketHistoryParams, opts?: CallOptions) => Promise<ApiResponse<T.MarketHistory>>;
    /** Who sells what. Costs 3 credits per 50 rows. `GET /market/sellers` */
    readonly sellers: (params?: MarketSellersParams, opts?: CallOptions) => Promise<ApiResponse<T.MarketSeller[]>>;
    /** One seller. Costs 2 credits. `GET /market/sellers/{id}` */
    readonly seller: (id: string, opts?: CallOptions) => Promise<ApiResponse<T.MarketSeller>>;
}
/** Event feed (Business and Enterprise) */
export declare class FeedApi extends FeedHelpers {
    private readonly c;
    constructor(c: Transport);
    /** The change feed. Business and Enterprise plans only. Costs nothing on a contract plan. `GET /feed` */
    readonly list: (params?: FeedListParams, opts?: CallOptions) => Promise<ApiResponse<T.FeedEvent[]>>;
}
/** Jokes, riddles, proverbs */
export declare class JokesApi {
    private readonly c;
    constructor(c: Transport);
    /** Jokes, funniest first. Costs 1 credit per 20 rows, 2 with `q`. `GET /jokes` */
    readonly list: (params?: JokesListParams, opts?: CallOptions) => Promise<ApiResponse<T.Joke[]>>;
    /** The joke of the day. Costs 1 credit. `GET /jokes/today` */
    readonly today: (params?: JokesTodayParams, opts?: CallOptions) => Promise<ApiResponse<T.JokeToday>>;
    /** A joke not yet shown. Costs 1 credit. `GET /jokes/random` */
    readonly random: (params?: JokesRandomParams, opts?: CallOptions) => Promise<ApiResponse<T.Joke>>;
    /** Joke topics. Costs 1 credit. `GET /jokes/topics` */
    readonly topics: (params?: JokesTopicsParams, opts?: CallOptions) => Promise<ApiResponse<T.JokeTopic[]>>;
    /** One joke. Costs 1 credit. `GET /jokes/{id}` */
    readonly get: (id: string, opts?: CallOptions) => Promise<ApiResponse<T.JokeFull>>;
}
/** Court hearings and cases */
export declare class CourtsApi {
    private readonly c;
    constructor(c: Transport);
    /** Courts and their seats. Costs 1 credit. `GET /courts/courts` */
    readonly courts: (opts?: CallOptions) => Promise<ApiResponse<T.Court[]>>;
    /** Court cases by name or number. Costs 3 credits per 20 rows. `GET /courts/search` */
    readonly search: (params: CourtsSearchParams, opts?: CallOptions) => Promise<ApiResponse<T.CourtCase[]>>;
    /** A day's hearings. Costs 2 credits per 50 rows. `GET /courts/hearings` */
    readonly hearings: (params?: CourtsHearingsParams, opts?: CallOptions) => Promise<ApiResponse<T.CourtHearing[]>>;
    /** One case. Costs 1 credit. `GET /courts/case` */
    readonly case: (params: CourtsCaseParams, opts?: CallOptions) => Promise<ApiResponse<T.CourtCaseFull>>;
    /** One judge's load. Costs 1 credit. `GET /courts/judges/{slug}` */
    readonly judge: (slug: string, opts?: CallOptions) => Promise<ApiResponse<T.CourtJudgeLoad>>;
    /** A name's cases. Costs 3 credits per 20 rows. `GET /courts/names/{kind}/{slug}` */
    readonly name: (kind: string, slug: string, params?: CourtsNameParams, opts?: CallOptions) => Promise<ApiResponse<T.CourtName>>;
    /** Court figures. Costs 2 credits. `GET /courts/stats` */
    readonly stats: (params?: CourtsStatsParams, opts?: CallOptions) => Promise<ApiResponse<T.CourtStats>>;
}
/** Romanian citizenship orders and oaths */
export declare class CitizenshipApi {
    private readonly c;
    constructor(c: Transport);
    /** A citizenship dossier by number. Costs 1 credit. `GET /citizenship/lookup` */
    readonly lookup: (params: CitizenshipLookupParams, opts?: CallOptions) => Promise<ApiResponse<T.CitLookup>>;
    /** Citizenship numbers. Costs 2 credits. `GET /citizenship/stats` */
    readonly stats: (params?: CitizenshipStatsParams, opts?: CallOptions) => Promise<ApiResponse<T.CitStats>>;
    /** Citizenship status lists. Costs 1 credit. `GET /citizenship/years` */
    readonly years: (opts?: CallOptions) => Promise<ApiResponse<T.CitYears>>;
    /** One status list. Costs 2 credits per 200 rows. `GET /citizenship/years/{slug}` */
    readonly year: (slug: string, params?: CitizenshipYearParams, opts?: CallOptions) => Promise<ApiResponse<T.CitYear>>;
    /** Citizenship orders. Costs 2 credits per 50 rows. `GET /citizenship/orders` */
    readonly orders: (params?: CitizenshipOrdersParams, opts?: CallOptions) => Promise<ApiResponse<T.CitOrders>>;
    /** One citizenship order. Costs 2 credits per 200 rows. `GET /citizenship/orders/{order}` */
    readonly order: (order: string, params?: CitizenshipOrderParams, opts?: CallOptions) => Promise<ApiResponse<T.CitOrder>>;
    /** Citizenship oath days. Costs 1 credit. `GET /citizenship/oath` */
    readonly oath: (opts?: CallOptions) => Promise<ApiResponse<T.CitOath>>;
}
/** Companies, contracts, licences, notices */
export declare class CompaniesApi {
    private readonly c;
    constructor(c: Transport);
    /** Companies by name or IDNO. Costs 3 credits per 20 rows. `GET /companies` */
    readonly search: (params: CompaniesSearchParams, opts?: CallOptions) => Promise<ApiResponse<T.CompanyCard[]>>;
    /** The register's figures. Costs 2 credits. `GET /companies/stats` */
    readonly stats: (opts?: CallOptions) => Promise<ApiResponse<T.CompanyStats>>;
    /** Licensed non-bank lenders. Costs 2 credits per 50 rows. `GET /companies/licences` */
    readonly licences: (params?: CompaniesLicencesParams, opts?: CallOptions) => Promise<ApiResponse<T.CompaniesLicencesData>>;
    /** ASP's legal notices. Costs 2 credits per 50 rows. `GET /companies/notices` */
    readonly notices: (params?: CompaniesNoticesParams, opts?: CallOptions) => Promise<ApiResponse<T.CompaniesNoticesData>>;
    /** One company. Costs 2 credits. `GET /companies/{idno}` */
    readonly get: (idno: string, opts?: CallOptions) => Promise<ApiResponse<T.Company>>;
    /** A company's contracts. Costs 2 credits per 50 rows. `GET /companies/{idno}/contracts` */
    readonly contracts: (idno: string, params?: CompaniesContractsParams, opts?: CallOptions) => Promise<ApiResponse<T.CompanyContract[]>>;
    /** A company's licences. Costs 1 credit. `GET /companies/{idno}/licences` */
    readonly licencesOf: (idno: string, opts?: CallOptions) => Promise<ApiResponse<T.CompaniesLicencesOfData>>;
    /** A company's notices. Costs 1 credit. `GET /companies/{idno}/notices` */
    readonly noticesOf: (idno: string, opts?: CallOptions) => Promise<ApiResponse<T.CompaniesNoticesOfData>>;
}
/** Shops' delivery and pickup terms */
export declare class DeliveryApi {
    private readonly c;
    constructor(c: Transport);
    /** Shops' delivery by town. Costs 2 credits. `GET /delivery` */
    readonly terms: (params?: DeliveryTermsParams, opts?: CallOptions) => Promise<ApiResponse<T.Delivery>>;
}
/** Insurance market and reference tariffs */
export declare class InsuranceApi {
    private readonly c;
    constructor(c: Transport);
    /** Insurers and their figures. Costs 2 credits. `GET /insurance/insurers` */
    readonly insurers: (opts?: CallOptions) => Promise<ApiResponse<T.Insurers>>;
    /** The insurance market. Costs 2 credits. `GET /insurance/market` */
    readonly market: (opts?: CallOptions) => Promise<ApiResponse<T.InsMarket>>;
    /** Reference tariffs. Costs 1 credit. `GET /insurance/tariffs` */
    readonly tariffs: (params?: InsuranceTariffsParams, opts?: CallOptions) => Promise<ApiResponse<T.ReferenceTariffs>>;
}
/** Addresses and streets */
export declare class GeoApi {
    private readonly c;
    constructor(c: Transport);
    /** An address to a point. Costs 1 credit. `GET /geo/search` */
    readonly search: (params: GeoSearchParams, opts?: CallOptions) => Promise<ApiResponse<T.Located | null>>;
    /** Streets. Costs 2 credits per 50 rows. `GET /geo/streets` */
    readonly streets: (params: GeoStreetsParams, opts?: CallOptions) => Promise<ApiResponse<T.StreetPiece[]>>;
}
/** Product catalogue tree */
export declare class CatalogApi {
    private readonly c;
    constructor(c: Transport);
    /** The category tree. Costs 0 credits. `GET /catalog/tree` */
    readonly tree: (opts?: CallOptions) => Promise<ApiResponse<T.CatalogTree>>;
}
/** Films, series, people and cinemas (Movies calls cost 40 credits) */
export declare class MoviesApi {
    private readonly c;
    constructor(c: Transport);
    /** Find films, series and people. Costs 40 credits. `GET /movies/search` */
    readonly search: (params: MoviesSearchParams, opts?: CallOptions) => Promise<ApiResponse<T.MovieList>>;
    /** One film or series. Costs 40 credits. `GET /movies/titles/{id}` */
    readonly title: (id: string, opts?: CallOptions) => Promise<ApiResponse<T.MovieTitle>>;
    /** A film or series in full. Costs 55 credits. `GET /movies/titles/{id}/full` */
    readonly titleFull: (id: string, opts?: CallOptions) => Promise<ApiResponse<T.MovieTitleFull>>;
    /** A film's sessions. Costs 40 credits. `GET /movies/titles/{id}/showtimes` */
    readonly showtimes: (id: string, params?: MoviesShowtimesParams, opts?: CallOptions) => Promise<ApiResponse<T.MovieShowtimes>>;
    /** One person. Costs 40 credits. `GET /movies/people/{id}` */
    readonly person: (id: string, opts?: CallOptions) => Promise<ApiResponse<T.MoviePerson>>;
    /** Films or series by filters. Costs 40 credits. `GET /movies/discover` */
    readonly discover: (params?: MoviesDiscoverParams, opts?: CallOptions) => Promise<ApiResponse<T.MovieList>>;
    /** What is trending. Costs 40 credits. `GET /movies/trending` */
    readonly trending: (params?: MoviesTrendingParams, opts?: CallOptions) => Promise<ApiResponse<T.MovieList>>;
    /** In cinemas. Costs 40 credits. `GET /movies/cinema` */
    readonly inCinemas: (params?: MoviesInCinemasParams, opts?: CallOptions) => Promise<ApiResponse<T.MovieList>>;
    /** Genres. Costs nothing. `GET /movies/genres` */
    readonly genres: (params?: MoviesGenresParams, opts?: CallOptions) => Promise<ApiResponse<T.MovieGenres>>;
    /** Cinemas of a country. Costs 40 credits. `GET /movies/cinemas` */
    readonly cinemas: (params?: MoviesCinemasParams, opts?: CallOptions) => Promise<ApiResponse<T.MoviesCinemasData>>;
    /** One cinema's sessions. Costs 40 credits. `GET /movies/cinemas/{id}/schedule` */
    readonly cinemaSchedule: (id: string, params?: MoviesCinemaScheduleParams, opts?: CallOptions) => Promise<ApiResponse<T.CinemaSchedule>>;
    /** A day in every cinema. Costs 40 credits. `GET /movies/cinemas/today` */
    readonly today: (params?: MoviesTodayParams, opts?: CallOptions) => Promise<ApiResponse<T.CinemaBoard>>;
    /** Today in Moldova's cinemas. No key, 0 credits. `GET /movies/board` */
    readonly board: (opts?: CallOptions) => Promise<ApiResponse<T.CinemaBoard>>;
}
/**
 * The Satelit data API client.
 *
 * ```ts
 * const satelit = new Satelit({ apiKey: process.env.SATELIT_API_KEY });
 * const { data, meta } = await satelit.rates.list();
 * ```
 */
export declare class Satelit extends SatelitCore {
    readonly rates: RatesApi;
    readonly fuel: FuelApi;
    readonly tariffs: TariffsApi;
    readonly indexes: IndexesApi;
    readonly law: LawApi;
    readonly news: NewsApi;
    readonly places: PlacesApi;
    readonly recipes: RecipesApi;
    readonly prices: PricesApi;
    readonly deals: DealsApi;
    readonly tours: ToursApi;
    readonly flights: FlightsApi;
    readonly rest: RestApi;
    readonly estate: EstateApi;
    readonly power: PowerApi;
    readonly market: MarketApi;
    readonly feed: FeedApi;
    readonly jokes: JokesApi;
    readonly courts: CourtsApi;
    readonly citizenship: CitizenshipApi;
    readonly companies: CompaniesApi;
    readonly delivery: DeliveryApi;
    readonly insurance: InsuranceApi;
    readonly geo: GeoApi;
    readonly catalog: CatalogApi;
    readonly movies: MoviesApi;
    /** Whole products as NDJSON (Enterprise). `GET /export/{product}` */
    readonly export: ExportApi;
    /** Your plan and credits. Costs nothing. `GET /me` */
    readonly me: (opts?: CallOptions) => Promise<ApiResponse<T.Me>>;
    /** The catalogue. No key, 0 credits. `GET /products` */
    readonly products: (opts?: CallOptions) => Promise<ApiResponse<T.Catalogue>>;
    /** The plans. No key, 0 credits. `GET /plans` */
    readonly plans: (opts?: CallOptions) => Promise<ApiResponse<T.Plans>>;
    /** Status. No key, 0 credits. `GET /status` */
    readonly status: (opts?: CallOptions) => Promise<ApiResponse<T.Status>>;
    /** How much data there is. No key, 0 credits. `GET /stats` */
    readonly stats: (opts?: CallOptions) => Promise<ApiResponse<T.Stats>>;
    /** A sample. No key, 0 credits. `GET /sample` */
    readonly sample: (opts?: CallOptions) => Promise<ApiResponse<T.Sample>>;
}
