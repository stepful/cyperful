/**
 * .complete() and .toPromise()
 */
export class Subject<T = void> {
  private _promise: Promise<T>;
  private _resolve!: (value: T) => void;
  private _reject!: (reason: any) => void;

  constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      // are these set synchronously?
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  complete(value: T) {
    this._resolve(value);
  }

  error(reason: any) {
    this._reject(reason);
  }

  toPromise() {
    return this._promise;
  }
}
