/**
 * Copyright 2016 Jim Armstrong (www.algorithmist.net)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Typescript Math Toolkit: Interval bisection - used to isolate a single, real root of a continuous function
 * inside a small interval (as a preliminary to pass onto a root-finder)
 *
 * @author Jim Armstrong (www.algorithmist.net)
 *
 * @version 1.0
 */
export interface Interval
{
  left: number;      // value of left interval endpoint
  right: number;     // value of right interval endpoint
  root: boolean;     // true if root exists in [left, right]
}

export class TSMT$Bisect
{
  private static EPS: number = 1.0 ; // stop when interval width is this value or less

  constructor()
  {
    // empty
  }

  /**
   * Bisect the supplied function over the input interval [a,b]
   *
   * @param {number} a left endpoint of interval
   *
   * @param {number} b right endpoint of interval
   *
   * @param {Function} f (takes a single number, x, and returns a number - the mathematical
   * function whose real root is desired)
   *
   * @returns {Interval}
   *
   * There is only minimal error-checking for performance reasons.
   */
  public static bisect(a: number, b: number, f: Function): Interval
  {
    let left: number   = Math.min(a,b);
    let right: number  = Math.max(a,b);
    let result: Object = this.__bisect(left, right, f);

    return result ? {left:+result['left'], right:+result['right'], root:true} : {left:a, right:b, root:false};
  }

  private static __bisect(left: number, right: number, f: Function): object | null
  {
    if (Math.abs(right-left) <= this.EPS) {
        return null;
    }

    if (f(left)*f(right) < 0)
    {
      return {left: left, right: right};
    }
    else
    {
      let middle: number = 0.5*(left + right);
      let leftInterval: Object = this.__bisect(left, middle, f);
      if (leftInterval != null) {
        return leftInterval;
      }

      let rightInterval: Object = this.__bisect(middle, right, f);
      if (rightInterval != null) {
        return rightInterval;
      }
    }

    return null;
  }
}
