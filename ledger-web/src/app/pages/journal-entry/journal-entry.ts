import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-journal-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './journal-entry.html', // Point to the HTML file
})
export class JournalEntryComponent implements OnInit {
  
  entryForm: FormGroup;
  groups: any[] = []; // List of accounts for the dropdown
  isLoading = false;
  
  // Totals for the bottom of the screen
  totalDr = 0;
  totalCr = 0;
  isBalanced = true;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    // 1. Initialize the Form
    this.entryForm = this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required], // Default to today
      narration: ['', Validators.required],
      items: this.fb.array([]) // Start with an empty list of rows
    });
  }

  ngOnInit() {
    this.fetchAccounts();
    this.addDefaultRows(); // Add 2 empty rows to start
  }

  // 👇 2. Getter for easier access in HTML
  get items() {
    return this.entryForm.get('items') as FormArray;
  }

  // 👇 3. Fetch Accounts for the Dropdown
  fetchAccounts() {
    this.http.get<any[]>('http://localhost:8000/api/groups').subscribe(data => {
      this.groups = data;
    });
  }

  // 👇 4. Add a New Row (Debit/Credit Line)
  addItem() {
    const row = this.fb.group({
      group_id: ['', Validators.required], // Account ID
      dc: ['D', Validators.required],      // Debit or Credit
      amount: [0, [Validators.required, Validators.min(0.01)]]
    });

    // Listen for changes to update totals immediately
    row.valueChanges.subscribe(() => this.calculateTotals());
    
    this.items.push(row);
  }

  addDefaultRows() {
    this.addItem(); // Row 1
    this.addItem(); // Row 2
  }

  // 👇 5. Remove a Row
  removeItem(index: number) {
    this.items.removeAt(index);
    this.calculateTotals();
  }

  // 👇 6. Live Math Calculation
  calculateTotals() {
    this.totalDr = 0;
    this.totalCr = 0;

    const rows = this.entryForm.value.items;
    
    rows.forEach((row: any) => {
      const val = parseFloat(row.amount) || 0;
      if (row.dc === 'D') this.totalDr += val;
      if (row.dc === 'C') this.totalCr += val;
    });

    // Check if balanced (allowing for tiny floating point errors)
    this.isBalanced = Math.abs(this.totalDr - this.totalCr) < 0.01;
  }

  // 👇 7. Submit to Backend
  onSubmit() {
    if (this.entryForm.invalid || !this.isBalanced) return;

    this.isLoading = true;
    
    this.http.post('http://localhost:8000/api/entries', this.entryForm.value)
      .subscribe({
        next: () => {
          alert('Entry Saved!');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error(err);
          alert('Error saving entry: ' + (err.error.message || 'Unknown error'));
          this.isLoading = false;
        }
      });
  }
}
