import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from "../../../services/ClientService";

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.component.html',
  imports: [
    ReactiveFormsModule
  ],
  styleUrls: ['./client-form.component.scss']
})
export class ClientFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  clientId: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.clientId = this.route.snapshot.paramMap.get('id');

    if (this.clientId) {
      this.isEdit = true;
      this.loadClient();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      type: ['BUYER', Validators.required],
      adresse: ['']
    });
  }

  loadClient(): void {
    if (!this.clientId) return;

    this.clientService.getById(this.clientId).subscribe({
      next: (client) => {
        this.form.patchValue(client);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const request = this.form.value;

    const action = this.isEdit && this.clientId
      ? this.clientService.update(this.clientId, request)
      : this.clientService.create(request);

    action.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/projets/clients']);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/projets/clients']);
  }
}
