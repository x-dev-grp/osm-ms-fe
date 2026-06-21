import { SearchData } from 'src/app/shared/models/advanced-search/searchData';

export interface ListContextConfig {
  titleTranslatePath?: string;
  hintTranslatePath?: string;
  icon?: string;
  variant?: 'default' | 'olive' | 'inventory';
}

export interface DashboardConfig {
  icon?: string | null;
  groupedActions?: boolean;
  specificActions?: {
    action: string;
    color: string;
    icon: string;
    disabled?: {
      field?: string;
      value: any;
    };
  }[];
  filteredActions?: string[];
  title: string;
  titleTranslatePath?: string;
  baseURL: string;
  searchEndpoint: string;
  defaultSearchData?: SearchData;
  filterTenant?: boolean;
  addNewItem: boolean;
  addNewItemUrl?: string;
  fields: Field[];
  actions?: Map<string, string>;
  fileName?: string;
  countBadgeSuffix?: string;
  countBadgeSuffixTranslatePath?: string;
  /** When true, data is supplied via setClientSource() instead of search API. */
  clientSide?: boolean;
  /** Hide the actions column (read-only dashboards). */
  hideActions?: boolean;
  /** Action triggered on row double-click. Defaults to READ, then READ_ARTICLE, then DETAIL. */
  doubleClickAction?: string;
  /** Optional explanatory banner above the list. Set to false to hide. */
  listContext?: ListContextConfig | false;
}
export interface Action {
  label: string;
  icon?: string;
  value?: any;
  isRemoveAction?: boolean;
  isDeeleteAction?: boolean;
}

export enum AttributeType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  date = 'date',
  object = 'object',
  enum = 'enum'
}
export enum FieldType {
  text = 'text',
  number = 'number',
  date = 'date',
  select = 'select',
  checkbox = 'checkbox',
  radio = 'radio',
  autocomplete = 'autocomplete',
  slider = 'slider',
  list = 'list'
}
interface Option {
  label: string;
  labelTranslatePath?: string;
  value: any;
}
export interface Field {
  name: string; //name in the backend entety  with nesting
  flattedListName?: string;
  booleanAttributeName?: string; //only when we need to display check box
  valuePath?: string;
  valueAttributeType?: AttributeType;
  label: string; // displayed label
  labelTranslatePath?: string;
  attributeType: AttributeType;
  fieldType: FieldType;
  isCurrency?: boolean;
  currency?: string;
  sortable?: boolean;
  dataTable?: boolean;
  filterable?: boolean;
  filterAttribute?: string;
  defaultFilter?: boolean;
  options?: Option[];
  getOptionsUrl?: string;
  autoCompleteDefaultCriteria?: SearchData;
  autoCompleteFilterAttributes?: string[];
  exportable?: boolean;
  exportLabel?: string;
  exportLabelTranslatePath?: string;
  exportValuePath?: string;
  sliderMinValue?: number;
  sliderMaxValue?: number;
  nameField?: string;
  columnPrefix?: string;
  valueField?: string;
  flattedList?: boolean;
  flattedItemIndex?: number;
  calculateTotal?: boolean;
}
