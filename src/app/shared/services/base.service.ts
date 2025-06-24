import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { SearchData } from "../models/advanced-search/searchData";
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
  })
  export class BaseService {

    constructor(private http: HttpClient) { }

    removeItem( path:string,itemId:string): Observable<any>  {
      return this.http.delete<any>(`${environment.apiUrl}/api/${path}/remove/${itemId}`);
    }

  }
