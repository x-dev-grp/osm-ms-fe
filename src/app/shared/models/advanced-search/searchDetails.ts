export class SearchDetails {
    minValue?: any;
    minValueOrEqual?: any;
    equalValue?: any;
    maxValue?: any;
    maxValueOrEqual?: any;
    likeValue?: any;
    lessThanOrEqualTo?: string;
    lessThan?: string;
    equalTo?: string;
    moreThan?: string;
    moreThanOrEqualTo?: string;
    likeThe?: string;
    containsValue?: any;
    contains?: string;
    in?: string[] = [];
    inValues?: any[] = [];
    isNull?: boolean;
    ignoreIfNull?:boolean = false;
  }