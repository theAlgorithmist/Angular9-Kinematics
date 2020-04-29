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
 * Placeholder for an initial joint and multiple terminal joints used to connect other chains.  Current
 * implementation uses three terminator joints - 'LEFT', 'MIDDLE', and 'RIGHT'.   Interactivity is disabled by default
 * so that mouse interaction does not interfere with a GUI driving chain generation.  After the chain is completed,
 * enable it in order for the Connector to react to mouse events.
 *
 * NOTE: Connector will undergo a complete refactor post Beta 1.0
 * 
 * @author Jim Armstrong
 * 
 * @version 1.0
 */

import { Bone       } from './bone';
import { IGraphics  } from '../../interfaces/graphics';
import { BONE_PROPS } from '../../interfaces/bone-properties';
import { BoneModel  } from '../../interfaces/bone-model';
import { Linkable   } from '../../interfaces/linkable';

export class Connector extends Bone
{
  // TODO Add arbitrary number of terminators and use a connector to facilitate multiple chains with a common origin point
  public static readonly PI_2: number       = 0.5*Math.PI;
  public static readonly TWO_PI: number     = Math.PI + Math.PI;
  public static readonly THREE_PI_2: number = 1.5 * Math.PI;

  // indicate type of terminal point for the connector
  public static readonly LEFT: string   = "L";
  public static readonly MIDDLE: string = "M";
  public static readonly RIGHT: string  = "R";
  
  protected _pivotX: number;           // x-coordinate of pivot point
  protected _pivotY: number;           // y-coordinate of pivot point
  protected _x0: number;               // x-coordinate of connector origin
  protected _y0: number;               // y-coordinate of connector origin
  protected _angle: number;            // atan2 orientation angle
  protected _boundX: number;           // x-coordinate of connector bounding-box
  protected _boundY: number;           // y-coordinate of connector bounding-box
  protected _width: number;            // width of bounding-box for the connector
  protected _height: number;           // height of bounding-box for the connector

  // terminal points or terminators
  protected _leftX: number;            // left-terminal point, x-coordinate
  protected _leftY: number;            // left-terminal point, y-coordinate
  protected _midX: number;             // middle-terminal point, x-coordinate
  protected _midY: number;             // middle-terminal point, y-coordinate
  protected _rightX: number;           // right-terminal point, x-coordinate
  protected _rightY: number;           // right-terminal point, y-coordinate
  protected _leftOrientation: number;  // orientation angle for left-terminator
  protected _midOrientation: number;   // orientation angle for mid-terminator
  protected _rightOrientation: number; // orientation angle for right-terminator

  // effector pinning
  protected _leftPinned: boolean;
  protected _midPinnned: boolean;
  protected _rightPinned: boolean;

  // connectors or chains linked forward to this one
  protected _linkLeft: Linkable;
  protected _linkMiddle: Linkable;
  protected _linkRight: Linkable;

  // a connector is centered within a specified bounding box whose upper, whose left-hand corner is specified in the constructor 
  constructor(g: IGraphics, x: number, y: number, w: number, h: number)
  {
    super(g);

    this.NAME            = "Connector";
    this.ID              = 0;
    this.ENABLED         = false;
    this.RENDERABLE      = true;
    this.LINE_THICKNESS  = 1;
    this.LINE_COLOR      = '0x666666';
    this.FILL_COLOR      = '0x999999';
    this.ROLL_OVER_COLOR = '0x6699cc';
    this.SELECTED_COLOR  = '0xff3333';

    this._pivotX  = x + 0.5*w;
    this._pivotY  = y + 0.5*h;
    this._length  = h;
    this._angle   = -Connector.PI_2;
    this._boundX  = x;
    this._boundY  = y;
    this._width   = w;
    this._height  = h;

    this._leftX         = 0;
    this._leftY         = 0;
    this._midX          = 0;
    this._midY          = 0;
    this._rightX        = 0;
    this._rightY        = 0;
    this._leftPinned    = false;
    this._midPinnned    = false;
    this._rightPinned   = false;
    this._isSelected    = false;
    this._linkLeft      = null;
    this._linkMiddle    = null;
    this._linkRight     = null;
    this._mouseEvent    = BONE_PROPS.BONE_NONE;

    this.__assignTerminators(x, y, w, h);
  }

  public get boundX(): number           { return this._boundX;           }
  public get boundY(): number           { return this._boundY;           }
  public get boundW(): number           { return this._width;            }
  public get boundH(): number           { return this._height;           }
  public get originX(): number          { return this._x0;               }
  public get originY(): number          { return this._y0;               }
  public get pivotX(): number           { return this._pivotX;           }
  public get pivotY(): number           { return this._pivotY;           }
  public get leftX(): number            { return this._leftX;            }
  public get midX(): number             { return this._midX;             }
  public get rightX(): number           { return this._rightX;           }
  public get leftY(): number            { return this._leftY;            }
  public get midY(): number             { return this._midY;             }
  public get rightY(): number           { return this._rightY;           }
  public get leftOrientation(): number  { return this._leftOrientation;  }
  public get midOrientation(): number   { return this._midOrientation;   }
  public get rightOrientation(): number { return this._rightOrientation; }

  public get linkedTo(): Linkable     { return this._linkedTo; }
  public get orientation(): number    { return this._angle >= 0 ? this._angle : Connector.TWO_PI + this._angle; }
  public get endOrientation(): number { return this._angle >= 0 ? this._angle : Connector.TWO_PI + this._angle; }

  // length is open to interpretation - currently distance between pivot and mid-terminator
  public get length(): number
  {
    const dX: number = this._midX - this._pivotX;
    const dY: number = this._midY - this._pivotY;

    return Math.sqrt(dX*dX + dY*dY);
  }

  public set linkedTo(c: Linkable)
  {
    // TODO for Connector; only implemented for Chain at present
  }

  // link one chain to another to one of the terminators
  public link(c: Linkable, terminator: string, orient: boolean=true): void
  {
    // note - orient=true not yet debugged - it's not used in Biped
    if (c != undefined)
    {
      c.linkedTo = this;

      switch (terminator)
      {
        case Connector.LEFT:
          if (orient)
            c.moveAndRotate(this._leftX, this._leftY, this._leftOrientation - c.orientation);
          else
            c.move(this._leftX, this._leftY);

          this._linkLeft = c;
          break;

        case Connector.MIDDLE:
          if (orient)
            c.moveAndRotate(this._midX, this._midY, this._midOrientation - c.orientation);
          else
            c.move(this._midX, this._midY);

          this._linkMiddle = c;
          break;

        case Connector.RIGHT :
          if (orient)
            c.moveAndRotate(this._rightX, this._rightY, this._rightOrientation - c.orientation);
          else
            c.move(this._rightX, this._rightY);

          this._linkRight = c;
          break;
      }
    }
  }

  // unlink all forward chains in this connector
  public unlink(): void
  {
    this._linkLeft   = null;
    this._linkMiddle = null;
    this._linkRight  = null;
  }

 /**
  * Select or highlight the connector - no handlers are fired
  *
  */
  public select(): void
  {
    this._isSelected = true;

    this.__redraw(this.SELECTED_COLOR);
  }

 /**
  * Deselect the connector
  */
  public deselect(): void
  {
    this._isSelected = false;

    this.__redraw(this.FILL_COLOR);
  }

  // change the connector's orientation by the input delta angle (radians in the range [0,2pi]
  public offsetOrientation(deltaAngle: number): void
  {
    // test to see if new angle would violate a joint limit
    if (!this._unconstrained)
    {
      let orient: number = this._angle + deltaAngle;
      orient             = orient >= 0 ? orient : Connector.TWO_PI + orient;

      // is there a parent orientation to check against?
      if (this._linkedTo != null)
      {
        // upper and lower limits relative to parent orientation - lower limit is always a negative value 
        const p0: number  = this._linkedTo.endOrientation;
        let lower: number = p0 + this.lowerLimit;
        lower             = lower > 0 ? lower : Connector.TWO_PI + lower;

        let upper: number = p0 + this.upperLimit;
        upper = upper <= Connector.TWO_PI ? upper : upper - Connector.TWO_PI;

        if (!this.__isInLimit(lower, upper, orient)) {
          return;
        }
      }
    }

    this._fk = BONE_PROPS.FK_ROTATE;

    const c: number = Math.cos(deltaAngle);
    const s: number = Math.sin(deltaAngle);

    const originXDelta: number = this._x0 - this._pivotX;
    const originYDelta: number = this._y0 - this._pivotY;

    this._x0 = originXDelta*c - originYDelta*s + this._pivotX;
    this._y0 = originXDelta*s + originYDelta*c + this._pivotY;

    const leftXDelta: number = this._leftX - this._pivotX;
    const leftYDelta: number = this._leftY - this._pivotY;

    this._leftX = leftXDelta*c - leftYDelta*s + this._pivotX;
    this._leftY = leftXDelta*s + leftYDelta*c + this._pivotY;

    const midXDelta: number = this._midX - this._pivotX;
    const midYDelta: number = this._midY - this._pivotY;

    this._midX = midXDelta*c - midYDelta*s + this._pivotX;
    this._midY = midXDelta*s + midYDelta*c + this._pivotY;

    const rightXDelta: number = this._rightX - this._pivotX;
    const rightYDelta: number = this._rightY - this._pivotY;

    this._rightX = rightXDelta*c - rightYDelta*s + this._pivotX;
    this._rightY = rightXDelta*s + rightYDelta*c + this._pivotY;

    // rotate the connector about the pivot (which also means a translation if the origin and pivot do not coincide),
    // then propagate forward
    this._angle  += deltaAngle;
    this._angle   = this._angle > Connector.TWO_PI ? this._angle - Connector.TWO_PI : this._angle;
    this._angle   = this._angle < -Connector.TWO_PI ? this._angle + Connector.TWO_PI : this._angle;

    this._graphics.x        = this._x0;
    this._graphics.y        = this._y0;
    this._graphics.rotation = this._angle;

    if (this._linkLeft != null) {
      this._linkLeft.moveAndRotate(this._leftX, this._leftY, deltaAngle);
    }

    if (this._linkMiddle != null) {
      this._linkMiddle.moveAndRotate(this._midX, this._midY, deltaAngle);
    }

    if (this._linkRight != null) {
      this._linkRight.moveAndRotate(this._rightX, this._rightY, deltaAngle);
    }
  }

  /*
    arguments are (absolute) lower limit, upper limit, and target child orientation
    this code is currently duplicated in Bone class, so it could have been put in BaseBone.
    reason for the duplication is that they may be implemented slightly differently in the
    future.
   */
  protected __isInLimit(lower: number, upper: number, child: number ): boolean
  {
    // compensate for periodicity in using absolute orientations - there are better ways, but this is conceptually simple
    if (lower > upper)
    {
      if (child >= Math.PI && child <= Connector.TWO_PI )
        return child >= lower && child <= (Connector.TWO_PI +upper);
      else
        return (child + Connector.TWO_PI) >= lower && child <= upper;
    }
    else
      return child >= lower && child <= upper;
  }

 /**
  * Move the connector
  *
  * @param toX: number - new x-coordinate
  * @param toY: number - new y-coordiante
  *
  */
  public move(toX: number, toY: number): void
  {
    const dX: number = toX - this._pivotX;
    const dY: number = toY - this._pivotY;

    this._x0     += dX;
    this._y0     += dY;
    this._leftX  += dX;
    this._leftY  += dY;
    this._midX   += dX;
    this._midY   += dY;
    this._rightX += dX;
    this._rightY += dY;

    this._pivotX = toX;
    this._pivotY = toY;

    this._graphics.x = this._x0;
    this._graphics.y = this._y0;

    if (this._linkLeft != null) {
      this._linkLeft.move(this._leftX, this._leftY);
    }

    if (this._linkMiddle != null) {
      this._linkMiddle.move(this._midX, this._midY);
    }

    if (this._linkRight != null) {
      this._linkRight.move(this._rightX, this._rightY);
    }
  }

 /**
  * Move the connector and rotate by the input delta angle
  *
  * @param toX: number       - new x-coordinate
  * @param toY: number       - new y-coordinate
  * @param _deltaAngle: number - delta angle
  *
  */
  public moveAndRotate(toX: number, toY: number, deltaAngle: number ): void
  {
    this._fk          = BONE_PROPS.FK_ROTATE;
    const dX: number = toX - this._pivotX;
    const dY: number = toY - this._pivotY;

    this._x0     += dX;
    this._y0     += dY;
    this._leftX  += dX;
    this._leftY  += dY;
    this._midX   += dX;
    this._midY   += dY;
    this._rightX += dX;
    this._rightY += dY;

    this._pivotX = toX;
    this._pivotY = toY;

    this._graphics.x = this._x0;
    this._graphics.y = this._y0;

    const c: number = Math.cos(deltaAngle);
    const s: number = Math.sin(deltaAngle);

    const leftXDelta: number = this._leftX - this._pivotX;
    const leftYDelta: number = this._leftY - this._pivotY;

    this._leftX = leftXDelta*c - leftYDelta*s + this._pivotX;
    this._leftY = leftXDelta*s + leftYDelta*c + this._pivotY;

    const midXDelta: number = this._midX - this._pivotX;
    const midYDelta: number = this._midY - this._pivotY;

    this._midX = midXDelta*c - midYDelta*s + this._pivotX;
    this._midY = midXDelta*s + midYDelta*c + this._pivotY;

    const rightXDelta: number = this._rightX - this._pivotX;
    const rightYDelta: number = this._rightY - this._pivotY;

    this._rightX = rightXDelta*c - rightYDelta*s + this._pivotX;
    this._rightY = rightXDelta*s + rightYDelta*c + this._pivotY;

    // rotate the connector about the pivot (which also means a translation if the origin and pivot do not coincide), then propagate forward
    this._angle += deltaAngle;
    this._angle  = (this._angle>Connector.TWO_PI) ? this._angle-Connector.TWO_PI : this._angle;
    this._angle  = (this._angle<-Connector.TWO_PI) ? this._angle+Connector.TWO_PI : this._angle;

    this._graphics.rotation = this._angle;

    if (this._linkLeft != null) {
      this._linkLeft.moveAndRotate(this._leftX, this._leftY, deltaAngle);
    }

    if (this._linkMiddle != null) {
      this._linkMiddle.moveAndRotate(this._midX, this._midY, deltaAngle);
    }

    if (this._linkRight != null) {
      this._linkRight.moveAndRotate(this._rightX, this._rightY, deltaAngle);
    }
  }

 /**
  * Destruct the connector
  *
  */
  public destruct(): void
  {
    // TODO
  }

 /**
  * Draw the connector
  *
  */
  public draw(): void
  {
    if (this.RENDERABLE)
    {
      this._graphics.clear();
      this._graphics.lineStyle(this.LINE_THICKNESS, this.LINE_COLOR);
      this._graphics.beginFill(this.FILL_COLOR);

      this._graphics.moveTo(this._custom[0], this._custom[1]);
      let j: number = 2;
      let i: number;

      for (i = 1; i < this._custPoints; ++i)
      {
        this._graphics.lineTo(this._custom[j], this._custom[j+1]);
        j += 2;
      }

      this._graphics.endFill();

      this._graphics.x        = this._x0;
      this._graphics.y        = this._y0;
      this._graphics.rotation = this._angle;
    }
  }

  protected __redraw(c: string): void
  {
    this._graphics.clear();
    this._graphics.lineStyle(this.LINE_THICKNESS, this.LINE_COLOR);
    this._graphics.beginFill(c);

    this._graphics.moveTo(this._custom[0], this._custom[1]);
    let j: number = 2;
    let i: number;

    for (i = 1; i < this._custPoints; ++i)
    {
      this._graphics.lineTo(this._custom[j], this._custom[j+1]);
      j += 2;
    }

    this._graphics.endFill();

    this._graphics.x        = this._x0;
    this._graphics.y        = this._y0;
    this._graphics.rotation = this._angle;
  }

  // assign terminator coordinates
  protected __assignTerminators(x: number, y: number, w: number, h: number): void
  {
    throw new Error("Connector::__assignTerminators() must be overriden");
  }

  // handle end-of-fk propagation event -- get the type of FK motion and pass it onto all linked chains
  protected __onFKEnd(b: BoneModel): void
  {
    let dA: number;

    switch (b.fkType)
    {
      case BONE_PROPS.FK_MOVE:
        if (this._linkLeft != null) {
          this._linkLeft.move(this._leftX, this._leftY);
        }

        // middle terminator not currently used
        if (this._linkRight != null) {
          this._linkLeft.move(this._leftX, this._leftY);
        }
        break;

      case BONE_PROPS.FK_ROTATE:
        if (this._linkLeft != null)
        {
          dA = this._leftOrientation-this._linkLeft.orientation;
          this._linkLeft.moveAndRotate(this._leftX, this._leftY, dA);
        }

        if (this._linkRight != null)
        {
          dA = this._rightOrientation-this._linkRight.orientation;
          this._linkRight.moveAndRotate(this._rightX, this._rightY, dA);
        }
        break;
    }
  }
}
