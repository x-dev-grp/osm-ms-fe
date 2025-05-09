import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { SearchData } from "../models/advanced-search/searchData";

@Injectable({
    providedIn: 'root'
  })
  export class AdvancedSearchService {
  
    constructor(private http: HttpClient) { }
  
    search(searchData:SearchData, path:string): Observable<any>  {
      return this.http.post<any>(`/api/${path}/advanced/search`,searchData);
    }
  
  }