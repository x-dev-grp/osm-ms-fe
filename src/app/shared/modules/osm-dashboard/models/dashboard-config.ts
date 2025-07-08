import { booleanAttribute } from "@angular/core";
import { SearchData } from "src/app/shared/models/advanced-search/searchData";

export interface DashboardConfig {
    title:string;
    titleTranslatePath?:string;
    baseURL: string;
    searchEndpoint: string;
    defaultSearchData?:SearchData;
    addNewItem:boolean;
    addNewItemUrl?:string;
    fields:Field[];
    actions?:Map<string,string>
    fileName?:string;
}
export interface Action {
  label: string;
  icon?: string;
  value?: any;
  isRemoveAction?:boolean;
  isDeeleteAction?:boolean;
}

export enum AttributeType{
    string="string",
    number="number",
    boolean="boolean",
    date="date",
    object="object",
    enum="enum"
}
export enum FieldType{
    text="text",
    number="number",
    date="date",
    select="select",
    checkbox="checkbox",
    radio="radio",
    autocomplete="autocomplete",
    slider="slider"
}
 interface Option {
    label: string;
    labelTranslatePath?:string;
    value: any;
}
export interface Field {
    name: string; //name in the backend entety  with nesting
    booleanAttributeName?:string, //only when we need to display check box
    valuePath?:string;
    valueAttributeType?:AttributeType;
    label: string;// displayed label
    labelTranslatePath?:string;
    attributeType: AttributeType;
    fieldType:FieldType;
    sortable?: boolean;
    dataTable?:boolean;
    filterable?: boolean;
    filterAttribute?: string;
    defaultFilter?:boolean;
    options?: Option[];
    getOptionsUrl?:string;
    autoCompleteDefaultCriteria?:SearchData;
    autoCompleteFilterAttributes?:string[]
    exportable?:boolean;
    exportLabel?:string;
    exportLabelTranslatePath?:string;
    exportValuePath?:string;
    sliderMinValue?:number;
    sliderMaxValue?:number;
}
