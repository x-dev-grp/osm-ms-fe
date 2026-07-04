export interface HelpModuleLink {
  id: string;
  titleKey: string;
  descKey: string;
  route: string;
  icon: string;
  accentClass: string;
}

export interface HelpModuleTask {
  labelKey: string;
  route: string;
}

export interface HelpCommonTask {
  labelKey: string;
  hintKey: string;
  route: string;
  icon: string;
}

export interface HelpFaqItem {
  questionKey: string;
  answerKey: string;
}

export interface HelpFlowStep {
  labelKey: string;
  icon: string;
}

export interface HelpPdfGuide {
  id: string;
  langKey: string;
  titleKey: string;
  descKey: string;
  fileName: string;
  flag: string;
}

export interface HelpNavItem {
  id: string;
  labelKey: string;
}

export interface HelpHrGuideLink {
  labelKey: string;
  route: string;
  icon: string;
}
