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
 * Two-link chain representing a Biped arm; the (biped) rig *must* supply upper-arm and forearm templates
 * 
 * @author Jim Armstrong
 * 
 * @version 1.0
 */
import { IGraphics    } from '../../interfaces/graphics';
import { Chain        } from './chain';
import { BoneTemplate } from './bone-template';
import { BONE_PROPS   } from '../../interfaces/bone-properties';

export class Arm extends Chain
{
  public static readonly UPPER_ARM: string  = "U";
  public static readonly FORE_ARM: string   = "F";
  public static readonly UPPER_FRAC: number = 0.48;   // fraction of total arm distance used for upper arm
  
  protected _boundX: number;  // bounding-box x-coordinate
  protected _boundY: number;  // bounding-box y-coordinate
  protected _boundW: number;  // bounding-box width
  protected _boundH: number;  // bounding-box height

  // graphics contexts for this arm
  protected _upperArm: IGraphics;
  protected _foreArm: IGraphics;

  // an arm is constructed inside a bounding box and orientation depends on type of arm (LEFT or RIGHT)
  constructor(
    g1: IGraphics,
    g2: IGraphics,
    x: number,
    y: number,
    w: number,
    h: number,
    type: BONE_PROPS,
    uArm: BoneTemplate,
    fArm: BoneTemplate,
    f: string,
    r: string
  )
  {
    super();

    this.NAME = "Arm";

    this.__create(x, y, w, h, type, uArm, fArm);

    // set fill and rollOver colors
    this.fillColor     = f;
    this.rollOverColor = r;
    this.selectedColor = '0xff3300';

    this._boundX = x;
    this._boundY = y;
    this._boundW = w;
    this._boundH = h;

    this._upperArm = g1;
    this._foreArm  = g2;
  }

  public get boundX(): number
  {
    return this._boundX;
  }

  public get boundY(): number
  {
    return this._boundY;
  }

  public get boundW(): number
  {
    return this._boundW;
  }

  public get boundH(): number
  {
    return this._boundH;
  }

  public get midX(): number
  {
    return this._boundX + 0.5*this._boundW;
  }

  public get midY(): number
  {
    return this._boundY + 0.5*this._boundH;
  }

  // construct the upper-arm and forearm chains - the Biped is considered facing forward, so right arm is flared
  // out to the left of centerline on stage
  protected __create(
    x: number,
    y: number,
    w: number,
    h: number,
    type: BONE_PROPS,
    uArm: BoneTemplate,
    fArm: BoneTemplate
  ): void
  {
    // total distance of upper-arm and forearm bones
    const d: number = Math.sqrt(w*w + h*h);

    let uX: number;     // x-coordinate of unit-vector in arm direction
    let uY: number;     // y-coordinate of unit-vector in arm direction
    let rootX: number;  // x-coordinate of chain root
    let rootY: number;  // y-coordinate of chain root
    let endX: number;   // x-coordinate of chain end (end joint of forearm)
    let endY: number;   // y-coordinate of chain end (end joint of forearm)
    let name: string;   // root name of each bone (indicating left or right arm)

    if (type == BONE_PROPS.LEFT)
    {
      rootX = x;
      rootY = y;
      endX  = x+w;
      endY  = y+h;
      uX    = w/d;
      uY    = h/d;
      name  = "L_";
    }
    else
    {
      rootX = x+w;
      rootY = y;
      endX  = x;
      endY  = y+h;
      uX    = -w/d;
      uY    = h/d;
      name  = "R_";
    }

    const upperRatio: number = Arm.UPPER_FRAC * d;
    const upperX: number     = upperRatio*uX + rootX;
    const upperY: number     = upperRatio*uY + rootY;

    this.addBoneAt(this._upperArm, rootX , rootY, upperX, upperY, name+"UPPER_ARM", 0, BONE_PROPS.CUSTOM, uArm, false);
    this.addBoneAt(this._foreArm , upperX, upperY, endX , endY  , name+"FOREARM"  , 1, BONE_PROPS.CUSTOM, fArm, false);
  }
}
