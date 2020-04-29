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

import { Chain     } from '../rigs/chain';
import { BoneModel } from '../../interfaces/bone-model';

// clockwise orientation for three points?
export function isClockwise(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): boolean
{
  return ((y2-y0)*(x1-x0) > (y1-y0)*(x2-x0));
}

export function getRotation(
  _xRoot: number,
  _yRoot: number,
  _p: number,
  _c: number,
  _lower: number,
  _upper: number,
  _bX: number,
  _bY: number,
  _tX: number,
  _tY: number
): number
{
  // a bit of brute force :)
  const TWO_PI: number = Math.PI + Math.PI;

  // all angles > 0
  const parent: number = _p > 0 ? _p : TWO_PI + _p;
  const child: number  = _c > 0 ? _c : TWO_PI + _c;

  let d: number     = 0;
  let lower: number = parent + _lower;
  lower             = lower >= 0 ? lower : TWO_PI + lower;

  const upper: number = parent + _upper;
  const cw: boolean   = isClockwise(_xRoot, _yRoot, _bX, _bY, _tX, _tY);

  if (cw)
  {
    d = upper-child;

    if (d > Math.PI) {
      d -= TWO_PI;
    }

    return d < 0 ? upper : _c;
  }
  else
  {
    d = child-lower;
    return d < 0 ? lower : _c;
  }
}

export function limbSolver(x: number, y: number, chain: Chain, isPinned: boolean, params: object): boolean
{
  // Joint limits
  let lowerLimit0: number;
  let upperLimit0: number;
  let lowerLimit1: number;
  let upperLimit1: number;

  if (params !== undefined && params != null)
  {
    lowerLimit0 = params['lowerLimit0'];
    upperLimit0 = params['upperLimit0'];
    lowerLimit1 = params['lowerLimit1'];
    upperLimit1 = params['upperLimit1'];
  }

  // solver tmp vars
  let _lower0: number   = !isNaN(lowerLimit0) ? lowerLimit0 : -3*Math.PI/5;  // final lower rotational limit for root bone
  let _upper0: number   = !isNaN(upperLimit0) ? upperLimit0 : 0.5*Math.PI;   // final upper rotational limit for root bone
  let _lower1: number   = !isNaN(lowerLimit1) ? lowerLimit1 : -0.5*Math.PI;  // final lower rotational limit for second bone
  let _upper1: number   = !isNaN(upperLimit1) ? upperLimit1 : 3*Math.PI/4;   // upper rotational limit for second bone

  const _xRoot: number  = chain.initX;        // x-coordinate of chain root
  const _yRoot: number  = chain.initY;        // y-coordinate of chain root
  const _b1: BoneModel  = chain.getBone(0);   // reference to first bone in chain
  const _b2: BoneModel  = chain.getBone(1);   // reference to second bone in chain
  const _l1: number     = _b1.length;
  const _l2: number     = _b2.length;

  let _lMax: number     = (_l1 + _l2)*(_l1 + _l2);
  let _two_l1l2: number = 2*_l1*_l2;
  let _l1Sq: number     = _l1*_l1;
  let _l2Sq: number     = _l2*_l2;

  // root-to-target distance (apply target limits here, if desired)
  const tX: number  = x;
  const tY: number  = y;
  const dX: number  = tX - _xRoot;
  const dY: number  = tY - _yRoot;
  const dSq: number = dX*dX + dY*dY;
  
  let limit: boolean = false;
  let b2X: number    = 0;
  let b2Y: number    = 0;
  let theta1: number = 0;
  let theta2: number = 0;

  // There are two possible infeasible conditions.  Each case is handled separately to make the solver easier to deconstruct

  // The chain is invalidated at the end of each solution, indicating that the position and orientation of anything linked
  // forward to the chain is no longer valid and needs to be updated.
  if (dSq > _lMax)
  {
    theta1 = Math.atan2(dY, dX);

    // joint limits
    if (theta1 < _lower0)
    {
      limit  = true;
      theta1 = _lower0;
    }

    if (theta1 > _upper0)
    {
      limit  = true;
      theta1 = _upper0;
    }

    // reorient root bone and use terminal coordinates to get initial coordinates for second bone
    _b1.reorient(0, 0, theta1, false, true);
    b2X = _b1.terminalX;
    b2Y = _b1.terminalY;

    if (limit)
    {
      // get the angle wrt joint limits given raw orientation unless the direction to the target is already in line with the first bone
      const pointTo: number = Math.atan2(tY-b2Y, tX-b2X);
      if (Math.abs(theta1-pointTo) < 0.1)
        theta2 = theta1;
      else
        theta2 = getRotation(_xRoot, _yRoot, theta1, pointTo, _lower1, _upper1, b2X, b2Y, tX, tY);

      // re-orient second bone (move and set orientation)
      _b2.reorient(b2X, b2Y, theta2, true, true);
    }
    else
      _b2.reorient(b2X, b2Y, theta1, true, true);

    chain.invalidate();
  }
  else
  {
    const c2: number = (dX*dX + dY*dY - _l1Sq - _l2Sq)/_two_l1l2;

    if (c2 < -1 || c2 > 1)
    {
      // infeasible solution - rotate in direction of target
      theta1 = Math.atan2(dY, dX);

      // joint limits
      theta1 = Math.max(theta1, _lower0);
      theta1 = Math.min(theta1, _upper0);

      _b1.reorient(0, 0, theta1, false, true);

      b2X = _b1.terminalX;
      b2Y = _b1.terminalY;

      const angle: number = Math.min(Math.PI, _upper1);
      _b2.reorient(b2X, b2Y, theta1+angle, true, true);

      chain.invalidate();
    }
    else
    {
      theta2             = Math.acos(c2);
      const s2: number   = Math.sin(theta2);
      const l2s2: number = _l2*s2;
      const l2c2: number = _l2*c2;
      const l1c2: number = _l1 + l2c2;

      theta1 = Math.atan2(l1c2*dY - l2s2*dX, l2s2*dY + l1c2*dX);

      // solution complete - apply joint limits
      if (theta1 < _lower0)
      {
        limit  = true;
        theta1 = _lower0;
      }
      else if (theta1 > _upper0)
      {
        limit  = true;
        theta1 = _upper0;
      }

      _b1.reorient(0, 0, theta1, false, true);

      b2X = _b1.terminalX;
      b2Y = _b1.terminalY;

      if (limit)
      {
        const pointTo: number = Math.atan2(tY-b2Y, tX-b2X);
        if (Math.abs(theta1-pointTo) < 0.1)
          theta2 = theta1;
        else
          theta2 = getRotation(_xRoot, _yRoot, theta1, pointTo, _lower1, _upper1, b2X, b2Y, tX, tY);

        _b2.reorient(b2X, b2Y, theta2, true, true);
      }
      else
      {
        theta2 = getRotation(_xRoot, _yRoot, theta1, theta1+theta2, _lower1, _upper1, b2X, b2Y, tX, tY);
        _b2.reorient(b2X, b2Y, theta2, true, true);
      }

      chain.invalidate();
    }
  }

  // did joint limits disallow complete movement to the target?
  if (limit) {
    return false;
  }

  // end-effector moved beyond max allowable distance for solution?
  return dSq <= _lMax;
}
