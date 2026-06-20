import { Article } from './article.model';

export interface MouvementStock {
  id?: string;
  article: Article;
  articleId?: string;
  quantite: number;
  typeMouvement: TypeMouvement;
  motif?: string;
  dateMouvement?: Date;
  lastModifiedDate: string;
  createdDate?: string;
}

export enum TypeMouvement {
  ENTREE = 'ENTREE',
  SORTIE = 'SORTIE',
  AJUSTEMENT = 'AJUSTEMENT'
}
