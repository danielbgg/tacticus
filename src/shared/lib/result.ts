export type Result<T, E = Error> = Ok<T> | Err<E>;

interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}
interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}
export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isOk<T, E>(r: Result<T, E>): r is Ok<T> {
  return r.ok;
}
export function isErr<T, E>(r: Result<T, E>): r is Err<E> {
  return !r.ok;
}

export function map<T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}

export function flatMap<T, U, E>(r: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E> {
  return r.ok ? fn(r.value) : r;
}

export function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

export type DbError = { code: string; message: string };
