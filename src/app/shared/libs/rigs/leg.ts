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
 * Manager for a two-bone leg chain; a leg is constructed inside a bounding box and orientation depends 
 * on type of leg (LEFT or RIGHT).  The (biped) rig *must* supply both upper- and lower-leg templates and
 * a graphics context for each bone.
 * 
 * @author Jim Armstrong
 * 
 * @version 1.0
 */

import { Chain        } from './chain';
import { BoneTemplate } from './bone-template';
import { BONE_PROPS   } from '../../interfaces/bone-properties';
import { IGraphics    } from '../../interfaces/graphics';

export class Leg extends Chain
{
  public static readonly UPPER_LEG: string  = "UL";
  public static readonly LOWER_LEG: string  = "LL";
  public static readonly UPPER_FRAC: number = 0.49;   // fraction of total leg distance used for upper leg
  
  protected _boundX: number;  // bounding-box x-coordinate
  protected _boundY: number;  // bounding-box y-coordinate
  protected _boundW: number;  // bounding-box width
  protected _boundH: number;  // bounding-box height

  protected _upperLeg: IGraphics;
  protected _lowerLeg: IGraphics;

  constructor (
    g1: IGraphics,
    g2: IGraphics,
    x: number,
    y: number,
    w: number,
    h: number,
    type: BONE_PROPS,
    uLeg: BoneTemplate,
    lLeg: BoneTemplate,
    f: string,
    r: string
  )
  {
    super();

    this._upperLeg = g1;
    this._lowerLeg = g2;

    this.NAME = type === BONE_PROPS.LEFT ? "L_Leg" : "R_Leg";

    this.__create(x, y, w, h, type, uLeg, lLeg);

    // set fill and rollOver colors
    this.fillColor     = f;
    this.rollOverColor = r;
    this.selectedColor = '0xff3300';

    this._boundX = x;
    this._boundY = y;
    this._boundW = w;
    this._boundH = h;
  }

  public get boundX(): number { return this._boundX;                    }
  public get boundY(): number { return this._boundY;                    }
  public get boundW(): number { return this._boundW;                    }
  public get boundH(): number { return this._boundH;                    }
  public get midX(): number   { return this._boundX + 0.5*this._boundW; }
  public get midY(): number   { return this._boundY + 0.5*this._boundH; }

  // construct the two leg bones - the Biped is considered facing forward, so right leg is to the left of centerline on stage
  protected __create(
    x: number,
    y: number,
    w: number,
    h: number,
    type: BONE_PROPS,
    uLeg: BoneTemplate,
    lLeg: BoneTemplate
  ): void
  {
    // note - the bounding-box width should be kept low to ensure the legs do not flare out too much

    // total distance of upper-arm and forearm bones
    const d: number = Math.sqrt(w*w + h*h);

    let uX: number;     // x-coordinate of unit-vector in arm direction
    let uY: number;     // y-coordinate of unit-vector in arm direction
    let rootX: number;  // x-coordinate of chain root
    let rootY: number;  // y-coordinate of chain root
    let endX: number;   // x-coordinate of chain end (end joint of forearm)
    let endY: number;   // y-coordinate of chain end (end joint of forearm)
    let name: string;   // root name of each bone (indicating left or right arm)

    if (type === BONE_PROPS.LEFT)
    {
      rootX = x;
      rootY = y;
      endX  = x + w;
      endY  = y + h;
      uX    = w / d;
      uY    = h / d;
      name  = "L_";
    }
    else
    {
      rootX = x + w;
      rootY = y;
      endX  = x;
      endY  = y + h;
      uX    = -w / d;
      uY    = h / d;
      name  = "R_";
    }

    const upperRatio: number = Leg.UPPER_FRAC*d;
    const upperX: number     = upperRatio*uX + rootX;
    const upperY: number     = upperRatio*uY + rootY;

    this.addBoneAt(this._upperLeg, rootX , rootY , upperX, upperY, name+"UPPER_LEG", 0, BONE_PROPS.CUSTOM, uLeg, false);
    this.addBoneAt(this._lowerLeg, upperX, upperY, endX  , endY  , name+"LOWER_LEG", 1, BONE_PROPS.CUSTOM, lLeg, false);
  }
}
