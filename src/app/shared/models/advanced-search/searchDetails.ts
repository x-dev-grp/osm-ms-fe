export class SearchDetails {
    minValue?: any;
    minValueOrEqual?: any;
    equalValue?: any;
    maxValue?: any;
    maxValueOrEqual?: any;
    likeValue?: any;
    lessThan?: string;
    equalTo?: string;
    containsValue?: any;
    contains?: string;
    inValues?: any[] = [];
    isNull?: boolean;
    ignoreIfNull?:boolean = false;
  }
