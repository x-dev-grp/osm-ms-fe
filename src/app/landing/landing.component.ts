import {Component, OnInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTabsModule} from '@angular/material/tabs';
import {MatChipsModule} from '@angular/material/chips';

interface Module {
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar: string;
  rating: number;
}

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
}

interface Stat {
  value: string;
  label: string;
  icon: string;
}

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

interface ProblemSolution {
  problem: string;
  solution: string;
  icon: string;
}

interface ComparisonRow {
  feature: string;
  before: string;
  after: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatToolbarModule,
    MatTabsModule,
    MatChipsModule
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {
  isVisible = false;
  scrolled = false;
  mobileMenuOpen = false;
  activeModule = 0;
  currentTestimonial = 0;
  activeTab = 'all';

  private testimonialInterval: any;
  private scrollListener: any;

  categoryTabs = ['all', 'production', 'gestion', 'finance', 'rh'];

  modules: Module[] = [
    {
      title: 'Réception des olives',
      description: 'Digitalisez la réception de vos olives : enregistrement complet avec poids net, tare, variété, origine. Le tout intégré à un contrôle qualité automatisé pour sécuriser chaque lot.',
      icon: 'inventory_2',
      color: 'emerald',
      category: 'production'
    },
    {
      title: 'Suivi de la production',
      description: 'Visualisez l\'efficacité de vos pressages : quantité traitée, pertes, sous-produits et rendement détaillé. Obtenez une traçabilité précise pour chaque étape de la transformation.',
      icon: 'settings',
      color: 'blue',
      category: 'production'
    },
    {
      title: 'Gestion des stocks',
      description: 'Surveillez vos cuves et réservoirs en temps réel. Recevez des alertes automatiques, gérez vos mouvements et exportez votre historique complet en un clic.',
      icon: 'analytics',
      color: 'amber',
      category: 'gestion'
    },
    {
      title: 'Paiement et comptabilité',
      description: 'Optimisez les paiements fournisseurs : bons, avances, exports Excel. Automatisez vos états financiers pour une comptabilité fluide.',
      icon: 'payments',
      color: 'purple',
      category: 'finance'
    },
    {
      title: 'RH & Paie',
      description: 'Centralisez la gestion du personnel : heures, salaires, bulletins de paie, déclarations. Une solution simple et fiable pour vos équipes.',
      icon: 'groups',
      color: 'rose',
      category: 'rh'
    },
    {
      title: 'Sécurité et traçabilité',
      description: 'Gardez un historique précis de chaque action. Contrôles d\'accès avancés, conformité RGPD et exports sécurisés assurent la confidentialité de vos données.',
      icon: 'lock',
      color: 'indigo',
      category: 'gestion'
    }
  ];

  testimonials: Testimonial[] = [
    {
      quote: 'Avant OSM, c\'était l\'enfer ! En tant que gérant, j\'étais noyé entre les papiers, Excel, les calculs, les relances. Depuis que j\'ai installé OSM, tout est clair, rapide, fiable.',
      author: 'Mohamed B.',
      role: 'Gérant d\'huilerie, Sfax',
      avatar: 'MB',
      rating: 5
    },
    {
      quote: 'La traçabilité est devenue notre force commerciale. Nos clients apprécient la transparence totale que nous pouvons leur offrir grâce à OSM.',
      author: 'Leila M.',
      role: 'Directrice de production, Sousse',
      avatar: 'LM',
      rating: 5
    },
    {
      quote: 'Le ROI a été immédiat. En deux mois, on a économisé plus que le coût annuel du logiciel juste en réduisant les erreurs de pesée.',
      author: 'Karim H.',
      role: 'Propriétaire, Monastir',
      avatar: 'KH',
      rating: 5
    }
  ];

  pricingPlans: PricingPlan[] = [
    {
      name: 'Starter',
      price: 'À partir de 299 DT/mois',
      description: 'Parfait pour les petites huileries',
      features: [
        'Réception des olives',
        'Suivi production basique',
        'Gestion stocks',
        'Support email',
        '1 utilisateur'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: 'À partir de 599 DT/mois',
      description: 'La solution complète pour huileries moyennes',
      features: [
        'Toutes les fonctions Starter',
        'RH & Paie intégré',
        'Comptabilité avancée',
        'Support prioritaire 7j/7',
        'Utilisateurs illimités',
        'Formation sur site',
        'Rapports personnalisés'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Sur mesure',
      description: 'Pour les grandes structures',
      features: [
        'Toutes les fonctions Professional',
        'Multi-sites',
        'API personnalisée',
        'Manager dédié',
        'SLA garanti',
        'Intégrations sur mesure',
        'Consultation stratégique'
      ],
      popular: false
    }
  ];

  stats: Stat[] = [
    {value: '50+', label: 'Huileries équipées', icon: 'emoji_events'},
    {value: '500K+', label: 'Tonnes traitées', icon: 'trending_up'},
    {value: '99.9%', label: 'Disponibilité', icon: 'bolt'},
    {value: '4.9/5', label: 'Satisfaction client', icon: 'star'}
  ];

  features: Feature[] = [
    {icon: 'bolt', title: 'Déploiement rapide', desc: 'Opérationnel en moins de 48h'},
    {icon: 'shield', title: 'Sécurité maximale', desc: 'Données cryptées et sauvegardées'},
    {icon: 'school', title: 'Formation incluse', desc: 'Votre équipe formée en 1 journée'},
    {icon: 'support_agent', title: 'Support 7j/7', desc: 'Assistance disponible en permanence'},
    {icon: 'cloud', title: 'Cloud ou local', desc: 'Vous choisissez l\'hébergement'},
    {icon: 'update', title: 'Mises à jour gratuites', desc: 'Nouvelles fonctionnalités régulières'}
  ];

  problemSolutions: ProblemSolution[] = [
    {
      problem: 'Pertes de temps avec les feuilles Excel',
      solution: 'Automatisation complète',
      icon: 'schedule'
    },
    {
      problem: 'Erreurs de calcul fréquentes',
      solution: 'Précision garantie à 100%',
      icon: 'error_outline'
    },
    {
      problem: 'Difficulté à suivre la production',
      solution: 'Dashboard temps réel',
      icon: 'bar_chart'
    },
    {
      problem: 'Litiges avec fournisseurs',
      solution: 'Traçabilité complète',
      icon: 'description'
    }
  ];

  comparisonData: ComparisonRow[] = [
    {feature: 'Saisie manuelle', before: '4h/jour', after: '15min/jour'},
    {feature: 'Erreurs de calcul', before: '5-10/jour', after: '0'},
    {feature: 'Temps de reporting', before: '2 jours', after: 'Instantané'},
    {feature: 'Litiges fournisseurs', before: 'Fréquents', after: 'Inexistants'}
  ];

  ngOnInit(): void {
    // Trigger fade-in animation
    setTimeout(() => {
      this.isVisible = true;
    }, 100);

    // Auto-rotate testimonials
    this.testimonialInterval = setInterval(() => {
      this.currentTestimonial = (this.currentTestimonial + 1) % this.testimonials.length;
    }, 6000);

    // Handle scroll event
    if (typeof window !== 'undefined') {
      this.scrollListener = () => {
        this.scrolled = window.scrollY > 50;
      };
      window.addEventListener('scroll', this.scrollListener);
    }
  }

  ngOnDestroy(): void {
    // Clean up intervals and listeners
    if (this.testimonialInterval) {
      clearInterval(this.testimonialInterval);
    }
    if (this.scrollListener && typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  setActiveModule(index: number): void {
    this.activeModule = index;
  }

  setTestimonial(index: number): void {
    this.currentTestimonial = index;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  get filteredModules(): Module[] {
    return this.activeTab === 'all'
      ? this.modules
      : this.modules.filter(m => m.category === this.activeTab);
  }

  getStarArray(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
