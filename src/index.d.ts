/**
 * Переопределение типизации метода `Buffer.concat` для исправления ошибки в "@types/node".
 *
 * @remarks
 * Типизация в `@types/node` неверно ограничивает первый параметр метода `Buffer.concat`,
 * запрещая использовать массивы `Buffer[]`. Однако, это противоречит официальной
 * документации Node.js, где указано, что массив `Buffer[]` поддерживается.
 *
 * @see {@link https://nodejs.org/docs/latest-v20.x/api/buffer.html#static-method-bufferconcatlist-totallength | Node.js Documentation: Buffer.concat}
 */
declare module 'buffer' {
  global {
    interface BufferConstructor {
      concat(list: readonly Uint8Array[] | Buffer[], totalLength?: number): Buffer;
      /**
       * Copies the underlying memory of `view` into a new `Buffer`.
       *
       * ```js
       * const u16 = new Uint16Array([0, 0xffff]);
       * const buf = Buffer.copyBytesFrom(u16, 1, 1);
       * u16[1] = 0;
       * console.log(buf.length); // 2
       * console.log(buf[0]); // 255
       * console.log(buf[1]); // 255
       * ```
       * @since v19.8.0
       * @param view The {TypedArray} to copy.
       * @param [offset=0] The starting offset within `view`.
       * @param [length=view.length - offset] The number of elements from `view` to copy.
       */
    }
  }
}
