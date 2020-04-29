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

/**
 * Basic implementation of a Cyclic Coordinate Descent procedure that often resolves a bone chain in a single
 * cycle.  Some parameters are hardcoded, such as max cycles and stopping criteria.  A future implementation
 * will likely allow for a params object to be passed to the function to facilitate user control of these values.
 *
 * @param x Target x-coordinate
 *
 * @param y Target y-coordinate
 *
 * @param chain Chain to which the solver is applied
 *
 * @param isPinned true if the end-effector is pinned and the target coords are for the initial point of the root bone,
 * not the end effector.
 *
 * @param params optional parameter object (name/value pairs) for adjustable parameters specific to an individual solver.
 */
export function ccdBasic(x: number, y: number, chain: Chain, isPinned: boolean, params: object = null): boolean
{
  // make things cleaner - return separate solution for pinned end-effector
  if (isPinned) {
    return ccdBasicPinned(x, y, chain);
  }
  
  let _targetX: number        = x;     // terminal bone target, x-coordinate
  let _targetY: number        = y;     // terminal bone target, y-coordinate
  let _curTargetX: number     = x;     // current target at k-th stage, x-coordinate
  let _curTargetY: number     = y;     // current target at k-th stage, y-coordinate
  let _termX: number          = 0;     // cache previous bone terminal x-coord
  let _termY: number          = 0;     // cache previous bone terminal y-coord
  let _recordX: Array<number> = [];    // record new target x-coordinates
  let _recordY: Array<number> = [];    // record new target y-coordinates
  let _iterations: number     = 0;     // count the number of iterations
  let _isTarget: boolean      = true;  // target phase?
  let _finished: boolean      = false; // moved as close as possible to end-effector
  let _deltaX: number         = 0;     // delta-x between terminal bone and end-effector x-coords, post-solution
  let _deltaY: number         = 0;     // delta-y between terminal bone and end-effector y-coords, post-solution
  let _stop: number           = 4;     // stopping criteria in terms of squared distance between end of chain and end-effector
  let _cycles: number         = 0;     // # cycles through solver
  let _maxCycles: number      = 3;     // maximum number allowed cycles

  let bone: BoneModel;
  let curX: number;
  let curY: number;
  
  while (!_finished)
  {
    if (_isTarget)
    {
      if (_iterations < chain.size)
      {
        const index: number = chain.size - _iterations - 1;
        bone                = chain.getBone(index);

        // angle needed to rotate current bone to align with current target
        const dX: number  = _curTargetX - bone.initX;
        const dY: number  = _curTargetY - bone.initY;
        const rot: number = Math.atan2(dY, dX);

        // compute new target based on current bone's length
        const l: number  = bone.length;
        _curTargetX = _curTargetX - l * Math.cos(rot);
        _curTargetY = _curTargetY - l * Math.sin(rot);

        // record new target for next phase unless at last step when we only need the target value
        if (index > 0)
        {
          _recordX[index-1] = _curTargetX;
          _recordY[index-1] = _curTargetY;
        }

        _iterations++;
      }
      else
      {
        // target phase complete ...
        _isTarget   = false;
        _finished   = false;
        _iterations = 0;

        // these coords are computed in reverse order
        _recordX[chain.size-1] = _curTargetX;
        _recordY[chain.size-1] = _curTargetY;
      }
    }
    else
    {
      if (_iterations < chain.size)
      {
        // position bones to targets
        bone = chain.getBone(_iterations);

        // if first iter., get deltas between current target and init coordinates of root bone.  (significant) Nonzero deltas mean
        // the end-effector does not reach the final target
        if (_iterations === 0)
        {
          curX         = bone.initX;
          curY         = bone.initY;
          _termX  = _recordX[0];
          _termY  = _recordY[0];
          _deltaX = _curTargetX - curX;
          _deltaY = _curTargetY - curY;

          // root bone is fixed - modify only terminal coordinates for root bone
          _termX -= _deltaX;
          _termY -= _deltaY;
          bone.setTerminal(_termX, _termY);
        }
        else if (_iterations < chain.size-1)
        {
          curX   = _termX;
          curY   = _termY;
          _termX = _recordX[_iterations] - _deltaX;
          _termY = _recordY[_iterations] - _deltaY;

          bone.setInitial(curX, curY, false);
          bone.setTerminal(_termX, _termY);
        }
        else
        {
          // final bone is initiated at last bone's terminal point and oriented towards the end-effector
          bone.setInitial(_termX, _termY, false);

          let dX: number = _targetX - _termX;
          let dY: number = _targetY - _termY;

          bone.orientation = Math.atan2(dY, dX);
        }

        _iterations++;
      }
      else
      {
        // test if current end effector is close enough to target
        const dX: number    = _targetX - chain.terminalX;
        const dY: number    = _targetY - chain.terminalY;
        const error: number = (dX*dX + dY*dY);
        _finished           = error <= _stop || + _cycles >= _maxCycles;

        if (!_finished)
        {
          _curTargetX = _targetX;
          _curTargetY = _targetY;
          _iterations = 0;
          _isTarget   = true;

          _cycles++;
        }
        else
        {
          // chain resolved to new terminal position matching end-effector
          return true;
        }
      }
    }
  }

  // as close as we can get ...
  return false;
}

export function ccdBasicPinned(x: number, y: number, chain: Chain): boolean
{
  // TODO Impl
  return false;
}
