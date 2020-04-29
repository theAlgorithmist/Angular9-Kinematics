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
 * Manager class for a Biped Neck (with a single optional terminator at the end effector).  The
 * (biped) rig *must* supply a neck Template.
 */

import { BoneTemplate } from './bone-template';
import { Connector    } from './connector';
import { IGraphics } from '../../interfaces/graphics';

export class Neck extends Connector
{
  constructor(g: IGraphics, x: number, y: number, w: number, h: number, t: BoneTemplate, r: string, c: string)
  {
    super(g, x, y, w, h);

    this.NAME    = "Neck";
    this.ID      = 0;
    this.ENABLED = false;
    this._pivotX = x + 0.5*w;
    this._pivotY = y + h;
    this._x0     = this._pivotX;
    this._y0     = this._pivotY;
    this._length = h;
    this._angle  = Connector.THREE_PI_2;

    this.FILL_COLOR      = r;
    this.ROLL_OVER_COLOR = c;
    this.SELECTED_COLOR  = '0xff3300';

    // nonlinear scale to fit bounding-box (use half-width due to symmetry)
    this.setTemplate(t, false, true, 0.5*w);

    // neck is not automatically drawn or enabled on construction -- this is up to the Rig
  }

  // assign terminator coordinates
  protected __assignTerminators(x: number, y: number, w: number, h: number): void
  {
    this._leftX = x;
    this._leftY = y + 0.5*h;

    this._midX = x + 0.5*w;
    this._midY = y;

    this._rightX = x + w;
    this._rightY = this._leftY;
  }
}
