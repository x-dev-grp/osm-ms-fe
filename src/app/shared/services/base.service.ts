import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { SearchData } from "../models/advanced-search/searchData";

@Injectable({
    providedIn: 'root'
  })
  export class BaseService {
  
    constructor(private http: HttpClient) { }
  
    removeItem( path:string,itemId:string): Observable<any>  {
      return this.http.delete<any>(`/api/${path}/remove/${itemId}`);
    }
  
  }