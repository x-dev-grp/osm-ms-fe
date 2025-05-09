import { SearchModel } from "./searchModel";

export class SearchData {
    page? = 0;
    size? = 10;
    sort? = 'createdDate';
    order? = 'DESC';
    searchData?: SearchModel;
  }