/**
 * Copyright 2020 Jim Armstrong (https://www.linkedin.com/in/jimarmstrong/)
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
 *
 * This software was derived from that containing the following copyright notice
 *
 * copyright (c) 2006, Jim Armstrong.  All Rights Reserved.
 *
 * This software program is supplied 'as is' without any warranty, express, implied,
 * or otherwise, including without limitation all warranties of merchantability or fitness
 * for a particular purpose.  Jim Armstrong shall not be liable for any special incidental, or
 * consequential damages, including, without limitation, lost revenues, lost profits, or
 * loss of prospective economic advantage, resulting from the use or misuse of this software
 * program.
 */

/**
 * A bone template is a set of points use to draw a specific bone in a UI.  Bones are considered to be symmetric,
 * so only half the total number of points is required to define a template.  For crude game characters, the bone
 * representation can double as a skin.  Template points are stored packed, i.e. [x0, y0, x1, y1, x2, y2 ...], and
 * oriented along the x-axis initial joint at the origin.  Templates are drawn point-to-point, but a cubic bezier
 * spline could be applied in the future
 *
 * @author Jim Armstrong
 *
 * @version 1.0
 */

export class BoneTemplate
{
  // properties
  public USE_SPLINE: boolean;          // true if the Template points are interpolated with a cubic Bezier spline
  public SPLINE_CLOSED: boolean;       // true if the cubic bezier spline is auto-closed

  protected _points:Array<number>;     // list of Template points (only symmetric part)
  protected _index: number;            // index into Template point array
  protected _count: number;            // total number of points
  protected _max: number;              // maximum y-coord

  constructor()
  {
    this._points = new Array<number>();
    this.reset();
  }

  /**
   * Access the number of points in this template
   */
  public get count(): number
  {
    return this._count;
  }

  /**
   * Access the maximum y-coordinate in the reference system
   */
  public get max(): number
  {
    return this._max;
  }

  /**
   * Access a copy of the template points
   */
  public get points(): Array<number>
  {
    return this._points.slice();
  }

  /**
   * Reset the template to accept new data
   */
  public reset(): void
  {
    this.USE_SPLINE    = false;
    this.SPLINE_CLOSED = false;

    this._points.length = 0;
    this._index         = 0;
    this._count         = 2;
  }

  /**
   * Insert a point into the bone template
   *
   * @param x x-coordinate of new point
   *
   * @param y y-coordinate of new point
   */
  public insert(x: number, y: number): void
  {
    this._points[this._index]   = x;
    this._points[this._index+1] = y;

    this._max = Math.max(this._max, y);

    this._count++;
    this._index += 2
  }

  /**
   * Assign data to this template from another template
   *
   * @param t Reference template whose data is used to define this template
   */
  public from(t: BoneTemplate): void
  {
    this.reset();

    const pts: Array<number> = t.points;
    pts.forEach( (val: number): void => {
      this._points.push(val);
    });

    this.USE_SPLINE    = t.USE_SPLINE;
    this.SPLINE_CLOSED = t.SPLINE_CLOSED;
    this._count        = t.count;
    this._index        = this._count - 2;
  }
}
