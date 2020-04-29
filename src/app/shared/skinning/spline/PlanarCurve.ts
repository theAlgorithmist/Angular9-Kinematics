/**
 * Copyright 2018 Jim Armstrong (www.algorithmist.net)
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
 * Typescript Math Toolkit: Abstract base class for a planar (parametric) curve, whose geometric constraints (control points)
 * are represented by (x0,y0), (cx,cy), (cx1, cy1), and (x1, y1).  (x0,y0) and (x1,y1) are generally interpolation points while
 * the middle one or two control points influences the curve shape.  (cx1, cy1) is not used in the case of a quadratic Bezier,
 * for example.
 *
 * @author Jim Armstrong (www.algorithmist.net)
 *
 * @version 1.0
 */
import { IControlPoints,
        IPoint
       } from './IPlanarCurve';

import { IPlanarCurve } from './IPlanarCurve';

export abstract class PlanarCurve implements IPlanarCurve
{
  // geometric constraints for up to a cubic curve
  protected _x0: number;
  protected _y0: number;
  protected _cx: number;
  protected _cy: number;
  protected _cx1: number;
  protected _cy1: number;
  protected _x1: number;
  protected _y1: number;

  // true if the quadratic coefficients are no longer valid due to resetting a control point value
  protected _invalidated: boolean = false;

  constructor()
  {
    this._x0  = 0;
    this._y0  = 0;
    this._cx  = 0;
    this._cy  = 0;
    this._cx1 = 0;
    this._cy1 = 0;
    this._x1  = 0;
    this._y1  = 0;
  }

  /**
   * Access x-coordinate of first control point
   *
   * @returns {number}
   */
  public get x0(): number
  {
    return this._x0;
  }

  /**
   * Access y-coordinate of first control point
   *
   * @returns {number}
   */
  public get y0(): number
  {
    return this._y0;
  }

  /**
   * Access x-coordinate of second control point
   *
   * @returns {number}
   */
  public get cx(): number
  {
    return this._cx;
  }

  /**
   * Access y-coordinate of second control point
   *
   * @returns {number}
   */
  public get cy(): number
  {
    return this._cy;
  }

  /**
   * Access x-coordinate of (optional) third control point
   *
   * @returns {number}
   */
  public get cx1(): number
  {
    return this._cx1;
  }

  /**
   * Access y-coordinate of (optional) third control point
   *
   * @returns {number}
   */
  public get cy1(): number
  {
    return this._cy1;
  }

  /**
   * Access x-coordinate of last control point
   *
   * @returns {number}
   */
  public get x1(): number
  {
    return this._x1;
  }

  /**
   * Access y-coordinate of last control point
   *
   * @returns {number}
   */
  public get y1(): number
  {
    return this._y1;
  }

  /**
   * Assign value for x-coordinate of first control point
   *
   * @param {number} value Desired value of x-coordinate
   *
   * @returns {nothing}
   */
  public set x0(value: number)
  {
    this._x0          = isNaN(value) || !isFinite(value) ? this._x0 : value;
    this._invalidated = true;
  }

  /**
   * Assign value for y-coordinate of first control point
   *
   * @param {number} value Desired value of y-coordinate
   *
   * @returns {nothing}
   */
  public set y0(value: number)
  {
    this._y0          = isNaN(value) || !isFinite(value) ? this._y0 : value;
    this._invalidated = true;
  }

  /**
   * Assign value for x-coordinate of second control point
   *
   * @param {number} value Desired value of x-coordinate
   *
   * @returns {nothing}
   */
  public set cx(value: number)
  {
    this._cx          = isNaN(value) || !isFinite(value) ? this._cx : value;
    this._invalidated = true;
  }

  /**
   * Assign value for y-coordinate of second control point
   *
   * @param {number} value Desired value of y-coordinate
   *
   * @returns {nothing}
   */
  public set cy(value: number)
  {
    this._cy          = isNaN(value) || !isFinite(value) ? this._cy : value;
    this._invalidated = true;
  }

  /**
   * Assign value for x-coordinate of (optional) third control point
   *
   * @param {number} value Desired value of x-coordinate
   *
   * @returns {nothing}
   */
  public set cx1(value: number)
  {
    this._cx1         = isNaN(value) || !isFinite(value) ? this._cx1 : value;
    this._invalidated = true;
  }

  /**
   * Assign value for y-coordinate of (optional) third control point
   *
   * @param {number} value Desired value of y-coordinate
   *
   * @returns {nothing}
   */
  public set cy1(value: number)
  {
    this._cy1         = isNaN(value) || !isFinite(value) ? this._cy1 : value;
    this._invalidated = true;
  }

  /**
   * Assign value for x-coordinate of last control point
   *
   * @param {number} value Desired value of x-coordinate
   *
   * @returns {nothing}
   */
  public set x1(value: number)
  {
    this._x1          = isNaN(value) || !isFinite(value) ? this._x1 : value;
    this._invalidated = true;
  }

  /**
   * Assign value for y-coordinate of last control point
   *
   * @param {number} value Desired value of y-coordinate
   *
   * @returns {nothing}
   */
  public set y1(value: number)
  {
    this._y1          = isNaN(value) || !isFinite(value) ? this._y1 : value;
    this._invalidated = true;
  }

  /**
   * Assign control points from an {Object}
   *
   * @param {IControlPoints} coefs
   */
  public fromObject(coefs: IControlPoints): void
  {
  }

  /**
   * Return current control points in an {Object} representation
   *
   * @returns {IControlPoints}
   */
  public toObject(): IControlPoints
  {
    return {
      x0: this._x0,
      y0: this._y0,
      cx: this._cx,
      cy: this._cy,
      cx1: this._cx1,
      cy1: this._cy1,
      x1: this._x1,
      y1: this._y1
    };
  }

  /**
   * Access the x-coordinate of the curve at the specified natural parameter value
   *
   * @param {number} t Natural parameter value, typically in [0,1]
   *
   * @returns {number}
   */
  public getX(t: number): number
  {
    return 0;
  }

  /**
   * Access the y-coordinate of the curve at the specified natural parameter value
   *
   * @param {number} t Natural parameter value, typically in [0,1]
   *
   * @returns {number}
   */
  public getY(t: number): number
  {
    return 0;
  }

  /**
   * Access the x-coordinate of the curve's first derivative at the specified natural parameter value
   *
   * @param {number} t Natural parameter value, typically in [0,1]
   *
   * @returns {number}
   */
  public getXPrime(t: number): number
  {
    return 0;
  }

  /**
   * Access the y-coordinate of the curve's first derivative at the specified natural parameter value
   *
   * @param {number} t Natural parameter value, typically in [0,1]
   *
   * @returns {number}
   */
  public getYPrime(t: number): number
  {
    return 0;
  }

  /**
   * Compute coefficients that cause the curve to interpolate the supplied set of data points
   *
   * @param {Array<IPoint>} points Interpolation points (three for a quadratic curve and four for a cubic)
   *
   * @returns {Array<number>} Natural parameters corresponding to interior interpolation points; one for
   * a quadratic curve and two for a cubic.
   */
  public interpolate(points: Array<IPoint>): Array<number>
  {
    return [0];
  }

  /**
   * Compute the natural parameter at the specified normalized arc length
   *
   * @param {number} s Normalized arc length in [0,1]
   *
   * @returns {number}
   */
  public getTAtS(s: number): number
  {
    return 0;
  }

  /**
   * Compute the natural parameter at the specified x-coordinate
   *
   * @param {number} x X-coordinate value
   *
   * @returns {Array<number>}
   */
  public getTAtX(x: number): Array<number>
  {
    return [];
  }


  /**
   * Compute the y-coordinate at the specified x-coordinate
   *
   * @param {number} x x-coordinate value
   *
   * @returns {Array<number>}
   */
  public getYAtX(x: number): Array<number>
  {
    return [];
  }

  /**
   * Compute the x-coordinate at the specified y-coordinate
   *
   * @param {number} y y-coordinate value
   *
   * @returns {Array<number>}
   */
  public getXAtY(y: number): Array<number>
  {
    return [];
  }

  /**
   * Compute arc length at the specified natural parameter value
   *
   * @param {number} t Natural parameter in [0,1]
   *
   * @returns {number}
   */
  public lengthAt(t: number): number
  {
    return 0;
  }
}
