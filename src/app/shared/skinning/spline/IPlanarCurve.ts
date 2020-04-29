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
 * Typescript Math Toolkit: Interface for planar curves (typically quadratic and cubic Bezier)
 *
 * @author Jim Armstrong (www.algorithmist.net)
 *
 * @version 1.0
 */
export interface IPoint
{
  x: number;

  y: number;
}

export interface IControlPoints
{
  x0: number;

  y0: number;

  cx: number;

  cy: number;

  cx1: number;

  cy1: number;

  x1: number;

  y1: number;
}

export interface IPlanarCurve extends IControlPoints
{
  fromObject(coefs: IControlPoints): void;

  toObject(): IControlPoints;

  getX(t: number): number;

  getY(t: number): number;

  getXPrime(t: number): number;

  getYPrime(t: number): number;

  interpolate(points: Array<IPoint>): Array<number>;

  getTAtS(s: number): number;

  getTAtX(x: number): Array<number>;

  getYAtX(x: number): Array<number>;

  getXAtY(y: number): Array<number>;

  lengthAt(t: number): number;
}
