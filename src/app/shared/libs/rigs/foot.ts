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
 * Manager class for a simple Biped Foot (toe links not currently used for simple 2D characters - this will be
 * deferred to a future implementation).  The (biped) rig *must* supply a drawing Template for the foot
 *
 * @author Jim Armstrong
 *
 * @version 1.0
 */

import { Connector    } from './connector';
import { IChain       } from '../../interfaces/chain-model';
import { BoneTemplate } from './bone-template';
import { BONE_PROPS   } from '../../interfaces/bone-properties';
import { IGraphics    } from '../../interfaces/graphics';

export class Foot extends Connector
{
  constructor(
    g: IGraphics, 
    x: number, 
    y: number, 
    w: number, 
    h: number, 
    type: BONE_PROPS,
    t:BoneTemplate, 
    r: string, 
    c: string)
  {
    super(g, x, y, w, h);

    this.NAME    = type == BONE_PROPS.LEFT ? "L_Foot" : "R_Foot";
    this.ID      = type == BONE_PROPS.LEFT ? 0 : 1;
    this.ENABLED = false;

    this._pivotX   = x + 0.5*w;
    this._pivotY   = y;
    this._x0       = this._pivotX;
    this._y0       = this._pivotY;
    this._length   = h;
    this._angle    = Connector.PI_2;
    this._linkedTo = null;

    this.FILL_COLOR      = r;
    this.ROLL_OVER_COLOR = c;
    this.SELECTED_COLOR  = '0xff3300';

    // nonlinear scale to fit bounding-box (use half-width due to symmetry)
    this.setTemplate(t, false, true, 0.5*w);

    // foot is not automatically drawn or enabled on construction -- this is up to the Rig
  }

  // assign terminator coordinates
  protected __assignTerminators(x: number, y: number, w: number, h: number): void
  {
    this._leftX = x;
    this._leftY = y;

    this._rightX = x+w;
    this._rightY = y;
  }
}
