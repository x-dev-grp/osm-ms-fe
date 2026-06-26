import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Article } from '../../../models/article.model';
import { ArticleService } from '../../../services/article.service';
import { OosmDashboard } from '../../../../shared/modules/oosm-dashboard/oosm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/oosm-dashboard/models/dashboard-config';
import { ARTICLE_DASHBOARD_CONFIG } from './article-dashboard.config';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [TranslateModule, OosmDashboard],
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss']
})
export class ArticleListComponent {
  @ViewChild('dashboard') dashboard!: OosmDashboard;

  dashboardConfig: DashboardConfig = ARTICLE_DASHBOARD_CONFIG;

  constructor(
    private readonly articleService: ArticleService,
    private readonly router: Router
  ) {}

  handleAction(event: { row: Article; action: string }): void {
    const article = event.row;

    switch (event.action) {
      case 'READ':
        void this.router.navigate(['/stock/articles', article.id]);
        break;
      case 'UPDATE':
        void this.router.navigate(['/stock/articles', article.id, 'edit']);
        break;
      case 'TOGGLE_ACTIVE':
        this.toActif(article);
        break;
    }
  }

  private toActif(article: Article): void {
    if (!article.id) {
      return;
    }

    const action = article.actif ? 'desactiver' : 'activer';
    if (!confirm(`Voulez-vous vraiment ${action} l'article "${article.nom}" ?`)) {
      return;
    }

    const request = article.actif ? this.articleService.desactiverArticle(article.id) : this.articleService.activerArticle(article.id);

    request.subscribe({
      next: () => this.dashboard?.refrechData(),
      error: (err) => console.error(err)
    });
  }
}
