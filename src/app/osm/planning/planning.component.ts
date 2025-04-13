import { Component } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../demo/shared/shared.module';
import { MillMachineService } from '../services/mill-machine.service';
import { MillMachine } from '../models/millMachine';
import { KanbanColumn } from '../../@theme/types/kanban-type';

@Component({
  selector: 'app-planning',
  imports: [CommonModule, SharedModule],
  templateUrl: './planning.component.html',
  standalone: true,
  styleUrl: './planning.component.scss'
})
export class PlanningComponent {
  // Columns will be built based on the list of machines.
  columns: KanbanColumn[] = [];

  constructor(private machineService: MillMachineService) {}

  ngOnInit(): void {
    // Fetch the list of machines from the backend via the MachineService.
    this.machineService.getAllMillMachines().subscribe((machines: MillMachine[]) => {
      // Map each machine into a KanbanColumn, initializing tasks array as empty.
      this.columns = machines.map((machine) => {
        return {
          machine: machine,
          tasks: [] // Later, you'll load the scheduled deliveries for each machine.
        } as unknown as KanbanColumn;
      });
    });
  }

  // Called when a task (delivery) is dropped into a column.
  drop(event: CdkDragDrop<never[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  // Optional: Open modal or perform actions to edit the task.
  editTaskOpen(task: string): void {
    console.log('Editing task:', task);
    // Implement your editing logic here.
  }

  // Optional: Delete a task from a column.
  deleteTask(task: string): void {
    console.log('Deleting task:', task);
  }

  // Optional: Toggle a UI element to add a new task.
  toggleTask(): void {
    console.log('Toggle add task');
    // Implement as needed.
  }

  // Optional: Submit new task (lot) for a specific machine column.
  taskSubmit(): void {
    // Implement task submission logic.
    console.log('Task submitted');
  }

  // Example: Retrieve story id for a task (if needed)
  getStoryId(taskId: number): number {
    return taskId;
  }
}
