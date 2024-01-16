import { spawn, ChildProcess } from 'child_process';

export class PredictedProcess {
  private _childProcess: ChildProcess | null = null;
  private _isRunning: boolean = false;
  private _completed: boolean = false;

  public constructor(
    public readonly id: number,
    public readonly command: string,
  ) {}

  /**
   * Cleans up the state of the PredictedProcess, removing listeners and resetting flags.
   */
  private cleanup() {
    if (this._childProcess) {
      this._childProcess.removeAllListeners();
      this._childProcess = null;
      this._isRunning = false;
      this._completed = false;
    }
  }

  /**
   * Spawns and manages a child process to execute a given command, with handling for an optional AbortSignal.
   *
   * This method asynchronously runs the specified command as a child process.
   * It returns a Promise that resolves when the process completes successfully or rejects if there is an error.
   * The method supports an optional AbortSignal to allow aborting the process if the signal is triggered.
   *
   * @param signal - An optional AbortSignal to allow aborting the process.
   * @returns A Promise that resolves when the process completes successfully or rejects on error.
   */
  public async run(signal?: AbortSignal): Promise<void> {
    // Check if the signal is already aborted
    if (signal && signal.aborted) {
      throw new Error('Signal already aborted');
    }

    // Check if the process has already completed successfully
    if (this._completed) {
      return Promise.resolve();
    }

    // Check if the process is already running
    if (this._isRunning) {
      throw new Error('Process already running');
    }

    // Create a promise for the async operation
    const promise = new Promise<void>((resolve, reject) => {
      const options = { shell: true };

      // Spawn the child process
      this._childProcess = spawn(this.command, options);
      this._isRunning = true;

      // Event handler for process error
      this._childProcess.on('error', (error) => {
        this.cleanup();
        reject(error);
      });

      // Event handler for process close
      this._childProcess.on('close', (code) => {
        this._completed = true;

        if (code === 0) {
          // Resolve the promise if the process completes successfully
          resolve();
        } else {
          // Reject the promise if the process terminates with an error
          reject(new Error(`Process failed with code ${code}`));
        }

        // Clean up the state
        this.cleanup();
      });

      // Event handler for AbortSignal
      if (signal) {
        signal.addEventListener('abort', () => {
          if (this._childProcess && !this._completed) {
            this._childProcess.kill();
          }
          this.cleanup();
          reject(new Error('Signal aborted'));
        });
      }
    });

    // Try to await the promise, catch errors, and ensure cleanup
    try {
      await promise;
    } catch (error) {
      throw error;
    } finally {
      this.cleanup(); // Ensure cleanup is always performed
    }

    return promise;
  }

  /**
   * Returns a memoized version of `PredictedProcess`.
   *
   * This method returns a new instance of `PredictedProcess` with the same `id` and `command`.
   * It is used to create a new PredictedProcess instance without carrying over the state of the current instance.
   *
   * @returns A new instance of `PredictedProcess` with the same `id` and `command`.
   */
  public memoize(): PredictedProcess {
    // Check if the process is still running
    if (this._isRunning) {
      throw new Error('Cannot memoize a running process');
    }

    // Ensure a new instance is created without carrying over state
    return new PredictedProcess(this.id, this.command);
  }

  /**
   * Checks if the process is currently running.
   *
   * @returns true if the process is running, false otherwise.
   */
  public isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Kills the child process associated with this PredictedProcess.
   * Cleans up the state to reflect the process being killed.
   */
  public kill(): void {
    if (this._childProcess && !this._completed) {
      this._childProcess.kill();
    }
    this.cleanup();
  }

  /**
   * Checks if the process has completed.
   *
   * @returns true if the process has completed, false otherwise.
   */
  public isCompleted(): boolean {
    return this._completed;
  }
}

export default PredictedProcess;
