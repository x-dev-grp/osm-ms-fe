import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-bom-gap-report',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './rapport-bom.component.html',
  styleUrls: ['./rapport-bom.component.scss']
})
export class RapportBomComponent implements OnInit {
  data: any[] = [];
  loading = false;

  distributionChartOptions: Partial<ApexOptions> | any;
  topGapsChartOptions: Partial<ApexOptions> | any;

  constructor(private analyticsService: AnalyticsService) { }

  ngOnInit() {
    this.loadData();
  }
  // button actualiser
  loadData() {
    this.loading = true;
    console.log('Loading Nomenclatures gap report...');
    this.analyticsService.getBomGap().subscribe({ //appelle le backend
      next: (res: any) => {
        console.log('Nomenclatures gap response:', res);
        this.data = res?.data ? res.data : res;  //lit la reponse
        this.initCharts(); //initialiser le graphique
        this.loading = false;//descativer le chargement
      },
      error: (err) => {
        console.error('Error', err);
        this.loading = false;
      }
    });
  }

  exportPdf() {
    this.loading = true;
    this.analyticsService.exportBomGapPdf().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Rapport_Ecarts_BOM.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error', err);
        this.loading = false;
      }
    });
  }

  //CETTE func telechargeer le boom en pdf depuis le backend
  private initCharts() {
    if (!this.data || this.data.length === 0) return;

    let surconsommation = 0;
    let sousconsommation = 0;
    let conforme = 0;

    this.data.forEach(item => {
      if (item.gapPercentage > 0) surconsommation++;
      else if (item.gapPercentage < 0) sousconsommation++;
      else conforme++;
    });

    this.distributionChartOptions = {
      series: [surconsommation, sousconsommation, conforme],
      chart: { type: 'donut', height: 320 },
      labels: ['Surconsommation (>0%)', 'Sous-consommation (<0%)', 'Conforme (0%)'],
      colors: ['#ef4444', '#10b981', '#64748b'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: true }
    };

    const sortedData = [...this.data]
      .sort((a, b) => Math.abs(b.gapPercentage) - Math.abs(a.gapPercentage))
      .slice(0, 10);

    this.topGapsChartOptions = {
      series: [{
        name: 'Écart (%)',
        data: sortedData.map(item => Number(item.gapPercentage).toFixed(2))
      }],
      chart: { type: 'bar', height: 320, toolbar: { show: false } },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
          distributed: true,
          colors: {
            ranges: [
              { from: -100, to: -0.01, color: '#10b981' },
              { from: 0.01, to: 1000, color: '#ef4444' }
            ]
          }
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: sortedData.map(item => item.materialName.substring(0, 15) + '...'),
        labels: { style: { fontSize: '10px' } }
      },
      tooltip: {
        y: { formatter: (val: number) => val + '%' }
      },
      legend: { show: false }
    };
  }
}
