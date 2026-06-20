import { SearchDetails } from './searchDetails';
import { SearchOperation } from './searchOperation';

export class SearchModel {
  search?: { [key: string]: SearchDetails } = {};
  searchs?: SearchModel[] = [];
  operation?: SearchOperation = SearchOperation.AND;
  reverse? = false;
}
