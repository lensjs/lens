import { Constructor } from "../types";

interface UnaryFunction<T, R> {
  (source: T): R;
}

export function compose<T extends Constructor, A>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
): A;
export function compose<T extends Constructor, A, B>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
  mixinB: UnaryFunction<A, B>,
): B;
export function compose<T extends Constructor, A, B, C>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
  mixinB: UnaryFunction<A, B>,
  mixinC: UnaryFunction<B, C>,
): C;
export function compose<
  T extends Constructor,
  Mixins extends UnaryFunction<T, T>,
>(superclass: T, ...mixins: Mixins[]) {
  return mixins.reduce((c, mixin) => mixin(c), superclass);
}
