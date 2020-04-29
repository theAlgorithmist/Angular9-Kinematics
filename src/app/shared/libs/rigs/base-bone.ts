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

import { BONE_PROPS   } from '../../interfaces/bone-properties';
import { BoneModel    } from '../../interfaces/bone-model';
import { BoneTemplate } from './bone-template';
import { Linkable     } from '../../interfaces/linkable';

export class BaseBone
{
  protected static readonly TWO_PI: number = Math.PI + Math.PI;

  // basic properties shared by all bone implementations, including drawing properties
  public NAME: string;             // name associated with this bone or connector
  public ID: number;               // numeric ID associated with this bone or connector
  public ENABLED: boolean;         // true if the connector is enabled
  public RENDERABLE: boolean;      // true if the connector is renderable
  public LINE_THICKNESS: number;   // line thickness for drawing
  public LINE_COLOR: string;       // line color
  public FILL_COLOR: string;       // fill color
  public ROLL_OVER_COLOR: string;  // mouse over fill color
  public SELECTED_COLOR: string;   // selected fill color
  public INTERPOLATE: boolean;     // true if using spline interpolation on custom drawing points, false to connect via straight lines
  public NEXT: BoneModel;          // next bone in chain
  public PREV: BoneModel;          // previous bone in chain
  public IS_ROOT: boolean;         // true if this is the root bone of a chain
  public IS_END: boolean;          // true if this is the terminal bone of a chain
  public IS_STRETCH: boolean;      // true if bone allows stretch/squash
  public SKIN_ONLY: boolean;       // true to draw skin only or bone and skin if false

  protected _length: number;       // length of bone or connector;
  protected _isSelected: boolean;  // true if bone or connector is selected
  protected _mouseEvent: string;   // type of mouse event
  protected _fk: string;           // type of FK currently applied
  protected _drawType: BONE_PROPS; // Draw type (standard bone or custom w/spline)

  protected _custom:Array<number>; // array of custom points [ x0,y0, x1,y1 ... ]
  protected _custPoints: number;   // number of custom drawing points

  // joint limits and linkage to (FK) and from (IK) - these are not to bones, but other linkages such as Chains/Connectors
  protected _lowerLimit: number;
  protected _upperLimit: number;
  protected _linkedTo: Linkable;
  protected _linkedFrom: Linkable;
  protected _unconstrained: boolean;

  // references to custom callbacks
  protected _onInitial: Function;            // initial fk propagation
  protected _onFinal: Function;              // final bone in fx propagation
  protected _rollOverHandler: Function;
  protected _rollOutHandler: Function;
  protected _selectedHandler: Function;

  // self-reference for callbacks
  protected _self;

  constructor()
  {
    this.NAME       = '';
    this.ID         = -1;
    this.NEXT       = null;
    this.PREV       = null;
    this.IS_ROOT    = false;
    this.IS_END     = false;
    this.IS_STRETCH = false;
    this.SKIN_ONLY  = false;

    this._length          = 0;
    this._mouseEvent      = BONE_PROPS.BONE_NONE;
    this._isSelected      = false;
    this._unconstrained   = true;
    this._onInitial       = null;
    this._onFinal         = null;
    this._rollOverHandler = null;
    this._rollOutHandler  = null;
    this._selectedHandler = null;

    this._lowerLimit = -BaseBone.TWO_PI;
    this._upperLimit = BaseBone.TWO_PI;
    this._linkedTo   = null;
    this._linkedFrom = null;
    this._drawType   = BONE_PROPS.STANDARD;

    this._custom     = null; // this reference must be obtained from a Template
    this._custPoints = 0;

    this._fk = BONE_PROPS.NONE;
  }

  /**
   * Access the most recent mouse event (this is currently deprecated)
   */
  public get mouseEvent(): string
  {
    return this._mouseEvent;
  }

  /**
   * Access lower rotational limit for this bone
   */
  public get lowerLimit(): number
  {
    return this._lowerLimit;
  }

  /**
   * Access upper rotational limit for this bone
   */
  public get upperLimit(): number
  {
    return this._upperLimit;
  }

  /**
   * Access forward linkage
   */
  public get linkedTo(): Linkable
  {
    return this._linkedTo;
  }

  /**
   * Access inverse linkage
   */
  public get linkedFrom(): Linkable
  {
    return this._linkedFrom;
  }

  /**
   * Assign the lower rotational limit for this bone
   *
   * @param r Lower limit (in radians)
   */
  public set lowerLimit(r: number)
  {
    this._lowerLimit    = r;
    this._unconstrained = (this._lowerLimit == -BaseBone.TWO_PI) && (this._upperLimit == BaseBone.TWO_PI);
  }

  /**
   * Assign the upper rotational limit for this bone
   *
   * @param r Upper limit (in radians)
   */
  public set upperLimit(r: number)
  {
    this._upperLimit   = r;
    this._unconstrained = (this._lowerLimit == -BaseBone.TWO_PI) && (this._upperLimit == BaseBone.TWO_PI);
  }

  /**
   * Assign forward linkage for this bone
   *
   * @param c Linkage to which forward transforms are propagated
   */
  public set linkedTo(c: Linkable)
  {
    this._linkedTo = c !== undefined && c != null ? c : this._linkedTo;
  }

  /**
   * Set inverse linkage for this bone
   *
   * @param c Linkage to which inverse transforms are propagated
   */
  public set linkedFrom(c: Linkable)
  {
    this._linkedFrom = c !== undefined && c != null ? c : this._linkedFrom;
  }

  /**
   * Assign a draw type (deprecated)
   *
   * @param s Draw Type (standard or custom); in the future, setting a template will force the draw type
   */
  public set drawType(s: BONE_PROPS)
  {
    this._drawType = s !== undefined ? s : this._drawType;
  }

  /**
  * Assign a symmetric drawing Template to define and draw bone shape; Bone must have defined length before setting
  * Template, otherwise it's normalized to zero length
  *
  * @param template Bone Template reference
  *
  * @param reset true if resetting the template
  *
  * @param useYScale true if y-coords in symmetric part of Template are nonlinearly scaled
  *
  * @param scaleTo target for y-scale
  */
  public setTemplate(t: BoneTemplate, reset: boolean=false, useYScale: boolean=false, scaleTo: number=0): void
  {
    if (reset) {
      this._custom.length = 0;
    }

    // reflect template points about the positive x-axis to complete the point set
    this._custom        = t.points;
    const count: number = t.count;

    let s: number = useYScale ? scaleTo/t.max : 1;
    let j: number = 0;
    let i: number;

    for (i=count-2; i>0; i--)
    {
      // x-coordinate
      this._custom[2*count+j] = this._custom[2*i];

      // y-coordinate
      if (useYScale) {
        this._custom[2 * i + 1] *= s;
      }

      this._custom[2*count+j+1] = -this._custom[2*i+1];

      j += 2;
    }

    // scale all points to match bone length
    this._custPoints = 2*(count-1);
    s                = this._length/100;

    j = 0;
    for (i=0; i<this._custPoints; i++)
    {
      this._custom[j] *= s;

      if (!useYScale) {
        this._custom[j + 1] *= s;
      }

      j += 2;
    }
  }

  /**
   * Register a low-level callback function
   *
   * @param e Event name
   *
   * @param f Callback function
   */
  public register(e: string, f: Function): void
  {
    switch(e)
    {
      case BONE_PROPS.ON_INITIAL:
        this._onInitial = f;
      break;

      case BONE_PROPS.ON_FINAL:
        this._onFinal = f;
      break;

      case BONE_PROPS.BONE_ROLL_OVER:
        this._rollOverHandler = f;
      break;

      case BONE_PROPS.BONE_ROLL_OUT:
        this._rollOutHandler = f;
      break;

      case BONE_PROPS.BONE_SELECTED:
        this._selectedHandler = f;
      break;
    }
  }
}
