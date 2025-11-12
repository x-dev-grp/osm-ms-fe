export interface SearchResponse {
 total:number;
 data:any[];
 totalPages:number;
 page:number;
 totals?:Map<string, number>;
}
