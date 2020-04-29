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
 * Manager class for a single-link Biped Clavicle (used for 2D characters with single-segment torso).  Interactivity
 * is disabled by default so that mouse interaction does not interfere with a GUI driving chain generation.  After the
 * chain is completed, enable it to react to mouse events.  Unlike other connectors, the clavicle pivot points depend
 * on 'left' or 'right' orientation, so an extra argument is required in the constructor.
 *
 * The supporting (biped) rig *must* supply a drawing Template for the clavicle
 */

import { Connector    } from './connector';
import { BoneTemplate } from './bone-template';
import { BONE_PROPS   } from '../../interfaces/bone-properties';
import { IGraphics    } from '../../interfaces/graphics';

export class Clavicle extends Connector
{
  constructor(
    g: IGraphics,
    x: number,
    y: number,
    w: number,
    h: number,
    o: string,
    t: BoneTemplate,
    r: string,
    c: string
  )
  {
    super(g, x, y, w, h);

    this.NAME    = (o === BONE_PROPS.LEFT ) ? "L_CLAVICLE" : "R_CLAVICLE";
    this.ID      = (o === BONE_PROPS.LEFT ) ? 0 : 1
    this.ENABLED = false;
    this._pivotX = x;
    this._pivotY = y + 0.5*h;
    this._x0     = this._pivotX;
    this._y0     = this._pivotY;

    let mX: number = 0;

    // pivot points and terminators depend on orientation - left clavicle extends to the right on Stage as Biped is facing forward
    if (o === BONE_PROPS.LEFT)
    {
      this._angle = Math.atan2(h, w);
      mX          = w;
    }
    else
    {
      this._angle = Math.atan2(h, -w);
      mX          = -w;
    }

    // only the mid-terminator is used and needs to be transformed based on the angle
    this._length     = w;

    const a: number  = o === BONE_PROPS.LEFT ? this._angle : this._angle - Math.PI;
    const c1: number = Math.cos(a);
    const s: number  = Math.sin(a);

    this._midX = mX*c1 + this._x0;
    this._midY = mX*s + this._y0;

    this.FILL_COLOR      = r;
    this.ROLL_OVER_COLOR = c;
    this.SELECTED_COLOR  = '0xff3300';

    // nonlinear scale to fit bounding-box (use half-height due to symmetry)
    this.setTemplate(t, false, true, 0.5*h);

    // spine is not automatically drawn or enabled on construction -- this is up to the Rig
  }

  // assign terminator coordinates
  protected __assignTerminators(x: number, y: number, w: number, h: number): void
  {
    // TODO
  }
}
