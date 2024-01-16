import { PredictedProcess } from './PredictedProcess';

export class PredictedProcessesManager {
  private _processes: PredictedProcess[] = [];

  // Constructor that initializes the PredictedProcessesManager with an array of processes
  public constructor(processes: readonly PredictedProcess[] = []) {
    // Copy the provided processes to the internal array
    this._processes = processes.slice();
  }

  // Getter to retrieve a copy of the processes array
  public get processes(): readonly PredictedProcess[] {
    return this._processes.slice();
  }

  // Method to add a new process to the manager
  public addProcess(process: PredictedProcess): this {
    // Add the provided process to the internal array
    this._processes.push(process);
    return this; // Return the instance for method chaining
  }

  // Method to remove a process from the manager by ID
  public removeProcess(id: number): this {
    // Filter out the process with the specified ID
    this._processes = this._processes.filter((process) => process.id !== id);
    return this; // Return the instance for method chaining
  }

  // Method to get a process from the manager by ID
  public getProcess(id: number): PredictedProcess | undefined {
    // Find and return the process with the specified ID
    return this.processes.find((process) => process.id === id);
  }

  /**
   * Executes multiple predicted processes.
   *
   * WRITE UP:
   * This method iterates over the stored PredictedProcess instances and runs each process concurrently.
   * It utilizes the `run` method of each PredictedProcess, allowing them to execute asynchronously.
   * The method returns a Promise that resolves when all processes have completed or rejects if any process fails.
   */
  public async runAll(signal?: AbortSignal): Promise<void> {
    // Create an array of Promises representing the execution of each process
    const promises = this._processes.map(async (process) => await process.run(signal));

    // Wait for all promises to settle (either resolve or reject)
    await Promise.all(promises);
  }
}
