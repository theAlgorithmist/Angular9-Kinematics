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
 * This is a default bone implementation with a simple outline and Canvas render via Pixi.js
 *
 * @author Jim Armstrong
 *
 * @version 1.0
 */

import { BaseBone     } from './base-bone';
import { BoneModel    } from '../../interfaces/bone-model';
import { IGraphics    } from '../../interfaces/graphics';
import { BONE_PROPS   } from '../../interfaces/bone-properties';
import { Linkable     } from '../../interfaces/linkable';
import { BoneTemplate } from './bone-template';

// skinning
import { TSMT$CubicBezierSpline } from '../../skinning/spline/CubicBezierSpline';
import { TSMT$CubicBezier       } from '../../skinning/spline/CubicBezier';

import * as PIXI from 'pixi.js/dist/pixi.js';

export enum SKIN_TYPE
{
  NONE         = 'none',
  SPLINE_BONE  = 'spline_bone',
  SPLINE_CHAIN = 'spline_chain',  // not yet supported
  SPRITE       = 'sprite'         // not yet supported
}

export class Bone extends BaseBone implements BoneModel
{
  public static readonly ALPHA: number      = 0.2;
  public static readonly THETA: number      = Math.PI / 8;
  public static readonly TWO_PI: number     = Math.PI + Math.PI;
  public static readonly DEG_TO_RAD: number = Math.PI/180;
  public static readonly RAD_TO_DEG: number = 180/Math.PI;

  protected _x0: number;                         // x-coordinate of initial joint
  protected _y0: number;                         // y-coordinate of initial joint
  protected _x1: number;                         // x-coordinate of terminal joint
  protected _y1: number;                         // y-coordinate of terminal joint
  protected _xL: number;                         // x-coordinate, left flare point, standard bone
  protected _yL: number;                         // y-coordinate, left flare point, standard bone
  protected _xR: number;                         // x-coordinate, right flare point, standard bone
  protected _yR: number;                         // y-coordinate, right flare point, standard bone
  protected _deltaX: number;                     // current x-delta between initial and terminal points
  protected _deltaY: number;                     // current y-delta between initial and terminal points
  protected _flare: number;                      // length of flare points
  protected _drawing: boolean;                   // true if draw is in progress
  protected _angle: number;                      // angle bone makes with positive x-axis
  protected _deltaAngle: number;                 // orientation delta angle
  protected _template: BoneTemplate;             // reference to custom bone template

  // skinning
  protected _skinPoints: Array<number>;          // [x0, y0, x1, y1, ...] representing spline points for outline skin
  protected _skinType: SKIN_TYPE;                // type of skin applied (defaults to none)
  protected _splineSkin: TSMT$CubicBezierSpline; // Reference to spline for outline skin
  protected _spriteSkin: PIXI.Sprite;            // bone controls a sprite as a default 'skin'

  // PIXI JS drawing
  protected _graphics: IGraphics;   // graphics context for rendering bone

  // PIXI JS mouse handlers
  protected _rollOverBone: (e: MouseEvent) => void;
  protected _rollOutBone: (e: MouseEvent) => void;
  protected _selectBone: (e: MouseEvent) => void;

  constructor(g: IGraphics)
  {
    super();

    this._graphics = g;
    this.init();

    this._onInitial       = null;
    this._onFinal         = null;
    this._rollOverHandler = null;
    this._rollOutHandler  = null;
    this._selectedHandler = null;
    this._template        = null;

    this._rollOverBone = (e: any) => this.__onRollOver(e);
    this._rollOutBone  = (e: any) => this.__onRollOut(e);
    this._selectBone   = (e: any) => this.__onSelected(e);

    this._skinPoints = new Array<number>();
    this._skinType   = SKIN_TYPE.NONE;
    this._splineSkin = null;
    this._spriteSkin = null;                // TODO API to assign the sprite

    this.enableMouseEvents();
  }

  /**
   * Access the x-coordinate of the initial bone point
   */
  public get initX(): number
  {
    return this._x0;
  }

  /**
   * Access the y-coordinate of the initial bone point
   */
  public get initY(): number
  {
    return this._y0;
  }

  /**
   * Access the x-coordinate of the terminal bone point
   */
  public get terminalX(): number
  {
    return this._x1;
  }

  /**
   * Access the y-coordinate of the terminal bone point
   */
  public get terminalY(): number
  {
    return this._y1;
  }

  /**
   * Access this bone's length
   */
  public get length(): number
  {
    return this._length;
  }

  /**
   * Access the bone's orientation (in radians) - will always be greater than zero
   */
  public get orientation(): number
  {
    return this._angle >= 0 ? this._angle : Bone.TWO_PI + this._angle;
  }

  /**
   * Access the end orientation (matches orientation for a single bone)
   */
  public get endOrientation(): number
  {
    return this._angle >= 0 ? this._angle : Bone.TWO_PI + this._angle;
  }

  /**
   * Access the bone's raw orientation angle (in radians)
   */
  public get angle(): number
  {
    return this._angle;
  }

  /**
   * Access the type of FK transform applied to this bone (will likely be deprecated)
   */
  public get fkType(): string
  {
    return this._fk;
  }

  /**
   * Access the skin points computed for this bone
   *
   * @param upper True if accessing only upper points in the case of a skin applied to an entire chain
   */
  public getSkinPoints(upper: boolean = true): Array<number>
  {
    return this._skinPoints.slice();
  }

  /**
   * Access the delta-angle for this bone (deprecated)
   */
  public get getDeltaAngle(): number
  {
    return this._deltaAngle;
  }

  /**
   * Access the skin type applied to this bone
   */
  public get skinType(): SKIN_TYPE
  {
    return this._skinType;
  }

  /**
   * Assign a skin type for this bone
   *
   * @param value Desired skin type
   */
  public set skinType(value: SKIN_TYPE)
  {
    this._skinType = value !== undefined && value != null ? value : this._skinType;
  }

  /**
   * Assign a template for drawing this bone (point-to-point).  Can be used as a primitive skin for some characters
   *
   * @param t Template for this bone
   */
  public set template(t: BoneTemplate)
  {
    if (t !== undefined && t != null && t instanceof BoneTemplate)
    {
      this._template = new BoneTemplate();

      this._template.from(t);

      // initial and terminal points set from template
      const points: Array<number> = this._template.points;
      const n: number             = points.length;

      this.setInitial(points[0], points[1]);
      this.setTerminal(points[n-2], points[n-1]);
    }
  }

  /**
   * Set initial joint coordinates for this Bone (also auto-computes relevant draw properties such as flare)
   *
   * @param cX x-coordinate of initial joint
   *
   * @param cY y-coordinate of initial joint
   *
   * @param updateLength True if length and related properties are updated as a result of setting this coordinate, otherwise
   * they are delayed until setting the terminal coordinate
   */
  public setInitial(cX: number, cY: number, updateLength: boolean=true): void
  {
    this._x0 = cX;
    this._y0 = cY;

    if (updateLength)
    {
      // distance is inlined for greater performance
      this._deltaX = this._x1 - this._x0;
      this._deltaY = this._y1 - this._y0;

      this._length = Math.sqrt(this._deltaX * this._deltaX + this._deltaY * this._deltaY);
      this._flare = Bone.ALPHA * this._length;

      this.__setSkinPoints();
    }
  }

  /**
   * Set terminal joint coordinates for this Bone
   *
   * @param cX x-coordinate of terminal joint for this Bone
   *
   * @param cY y-coordinate of terminal joint for this Bone
   */
  public setTerminal(cX: number, cY: number): void
  {
    if (!this._drawing)
    {
      this._x1 = cX;
      this._y1 = cY;

      // distance is inlined for greater performance
      this._deltaX = this._x1 - this._x0;
      this._deltaY = this._y1 - this._y0;

      this._length = Math.sqrt(this._deltaX*this._deltaX + this._deltaY*this._deltaY);
      this._flare  = Bone.ALPHA*this._length;
      this._angle  = Math.atan2(this._deltaY, this._deltaX);

      this.__setSkinPoints();
    }
  }

  /**
   *  Change the bone's orientation by rotating to a new angle either clockwise or counter-clockwise
   *  
   *  @param rad New orientation in radians
   */
  public set orientation(rad: number)
  {
    // current orientation in [0,2pi] relative to positive x-axis
    const orient: number = this._angle >=0 ? this._angle : Bone.TWO_PI + this._angle;

    // input orientation
    const angle: number = rad >= 0 ? rad : Bone.TWO_PI + rad;

    // compute delta angle
    let dA: number = angle - orient;

    // changes in orientation should be very small - a big gap indicates moving from near 2PI across zero or vice versa.
    if (Math.abs(dA) > Math.PI) {
      dA = dA < 0 ? dA + Bone.TWO_PI : dA - Bone.TWO_PI;
    }

    let parent: Linkable;
    if (!this._unconstrained)
    {
      // would this orientation cause a rotational limit to be exceeded?  if root bone, get parent orientation from
      // _linkedTo - otherwise from PREV
      parent = (this.PREV != null) ? this.PREV : this._linkedTo;

      // is there a parent orientation to check against?
      if (parent != null)
      {
        // upper and lower limits relative to parent orientation - lower limit is always a negative value 
        // 'end' orientation is either bone orientation, end-of-chain orientation, or connector orientation
        let p0: number    = parent.endOrientation;
        let lower: number = p0 + this.lowerLimit;
        lower             = (lower>0) ? lower : Bone.TWO_PI+lower;

        let upper: number = p0 + this.upperLimit;
        upper             = upper <= Bone.TWO_PI ? upper : upper-Bone.TWO_PI;

        if (!this.__isInLimit(lower, upper, angle)) {
          return;
        }
      }
    }

    this._fk         = BONE_PROPS.FK_ROTATE;
    this._angle      = angle;
    this._deltaAngle = dA;

    const c: number = Math.cos(this._deltaAngle);
    const s: number = Math.sin(this._deltaAngle);

    // rotate (_deltaX,_deltaY) dA radians about the origin and then translate to (_x0,_y0) to compute new terminal point
    const newDX: number = this._deltaX*c - this._deltaY*s;
    const newDY: number = this._deltaX*s + this._deltaY*c;

    this._x1     = newDX + this._x0;
    this._y1     = newDY + this._y0;
    this._deltaX = newDX;
    this._deltaY = newDY;
    this._length = Math.sqrt(this._deltaX * this._deltaX + this._deltaY * this._deltaY);
    this._flare  = Bone.ALPHA*this._length;

    // rotate the bone, then propagate forward
    this._graphics.rotation = this._angle;
  
    if (this.NEXT != null)
    {
      this.NEXT.moveAndRotate(this._x1, this._y1, this._deltaAngle, c, s);
    }
    else
    {
      // execute callback at completion of FK propagation
      if (this._onFinal != null) {
        this._onFinal(this._deltaAngle);
      }

      // is this bone linked to a chain?
      if (this._linkedTo != null) {
        this._linkedTo.move(this._x1, this._y1);
      }
    }
  }

  /**
   * Move the bone to the specified coordinates (does not affect orientation)
   *
   * @param toX New x-coordinate for the initial point
   *
   * @param toY New y-coordinate for the initial point
   */
  public move(toX: number, toY: number): void
  {
    this.moveInitial(toX, toY);
  }

 /**
  * Move the initial point or joint to the new coordinates and offset terminal joint to maintain orientation
  *
  * @param toY new x-coordinate of initial point
  *
  * @param toY new y-coordinate of initial point
  */
  public moveInitial(toX: number, toY:number): void
  {
    const dX: number = toX - this._x0;
    const dY: number = toY - this._y0;
    this._fk         = BONE_PROPS.FK_MOVE;

    // deltaX and deltaY are unchanged on move
    this._x0  = toX;
    this._y0  = toY;
    this._x1 += dX;
    this._y1 += dY;

    // re-position the bone, then propagate forward
    this._graphics.x = this._x0;
    this._graphics.y = this._y0;

    if (this.NEXT != null)
    {
      this.NEXT.moveInitial(this._x1, this._y1);
    }
    else
    {
      // execute callback at completion of FK propagation
      if (this._onFinal != null ) {
        this._onFinal(0);
      }

      // is this bone linked to a chain?
      if (this._linkedTo != null) {
        this._linkedTo.move(this._x1, this._y1);
      }
    }
  }

  /**
   * Rotate Bone by the supplied incremental angle
   *
   * @param deltaAngle delta Angle
   *
   * @param c cos(deltaAngle) previously computed in parent bone (optional)
   *
   * @param s sin(deltaAngle) previously computed in parent bone (optional)
   */
  public rotate(deltaAngle: number, c?: number, s?: number): void
  {
    this._fk     = BONE_PROPS.FK_ROTATE;
    this._angle += deltaAngle;

    const c1: number = c === undefined ? Math.cos(deltaAngle) : c;
    const s1: number = s === undefined ? Math.sin(deltaAngle) : s;

    const dx: number = this._deltaX*c1 - this._deltaY*s1;
    const dy: number = this._deltaX*s1 + this._deltaY*c1;

    this._x1     = dx + this._x0;
    this._y1     = dy + this._y0;
    this._deltaX = dx;
    this._deltaY = dy;

    // re-orient the bone, then propagate forward
    this._graphics.rotation += deltaAngle;

    if (this.NEXT != null)
    {
      this.NEXT.moveAndRotate(this._x1, this._y1, deltaAngle, c1, s1);
    }
    else
    {
      // execute handler at completion of boneFK propagation
      if (this._onFinal != null) {
        this._onFinal(deltaAngle);
      }

      // is this bone linked to a chain?
      if (this._linkedTo != null) {
        this._linkedTo.moveAndRotate(this._x1, this._y1, deltaAngle, c1, s1);
      }
    }
  }

 /**
  * Move Bone to new coordinates and simultaneously rotate
  *
  * @param toX new x-coordinate of joint
  * 
  * @param toY new y-coordinate of joint
  * 
  * @param deltaAngle delta Angle
  * 
  * @param c cos(deltaAngle) previously computed in parent bone, used for fast FK propagation
  * 
  * @param s sin(deltaAngle) previously computed in parent bone, used for fast FK propagation
  */
  public moveAndRotate(toX: number, toY: number, deltaAngle: number, c?: number, s?: number): void
  {
    // Neither translation or rotation change the bone's length.
    this._x0     = toX;
    this._y0     = toY;
    this._fk     = BONE_PROPS.FK_ROTATE;
    this._angle += deltaAngle;

    const c1: number = c === undefined ? Math.cos(deltaAngle) : c;
    const s1: number = s === undefined ? Math.sin(deltaAngle) : s;

    const dx: number = this._deltaX*c1 - this._deltaY*s1;
    const dy: number = this._deltaX*s1 + this._deltaY*c1;

    this._x1     = dx + this._x0;
    this._y1     = dy + this._y0;
    this._deltaX = dx;
    this._deltaY = dy;

    // re-orient the bone, then propagate forward
    this._graphics.rotation += deltaAngle;

    this._graphics.x = this._x0;
    this._graphics.y = this._y0;

    if (this.NEXT != null)
    {
      this.NEXT.moveAndRotate(this._x1, this._y1, deltaAngle, c1, s1);
    }
    else
    {
      // execute handler at completion of FK propagation
      if (this._onFinal != null) {
        this._onFinal(deltaAngle);
      }

      // is this bone linked to a chain?
      if (this._linkedTo != null) {
        this._linkedTo.moveAndRotate(this._x1, this._y1, deltaAngle, c1, s1);
      }
    }
  }

  /**
   * Place the bone in a new orientation without triggering FK
   *
   * @param toX optional new initial x-coordinate
   *
   * @param toY optional new initial y-coordinate
   *
   * @param angle new bone orientation in radians
   *
   * @param move  true if the bone is both moved and rotated, false if rotation only
   *
   * @param rotate true if bone sprite orientation is set, otherwise caller is responsible for redrawing the bone
   */
  public reorient(toX: number, toY: number, angle: number, move: boolean=true, rotate:boolean=true): void
  {
    this._angle = angle;

    if (move)
    {
      this._x0   = toX;
      this._y0   = toY;

      this._graphics.x = this._x0;
      this._graphics.y = this._y0;
    }

    this._x1 = this._x0 + this._length*Math.cos(this._angle);
    this._y1 = this._y0 + this._length*Math.sin(this._angle);

    if (rotate) {
      this._graphics.rotation = this._angle;
    }
  }

  /**
   * Draw the bone into a previously supplied graphic context
   */
  public draw(): void
  {
    if (this._drawing) {
      return;
    }

    if (this.RENDERABLE)
    {
      this._drawing = true;

      if (this._drawType === BONE_PROPS.STANDARD)
        this.__std(this.FILL_COLOR);
      else
        this.__drawCustom(this.FILL_COLOR);
    }
  }

  /**
   * Select this bone (redraws the bone with the selected fill color)
   */
  public select() :void
  {
    // highlight only; no mouse interaction - do not fire selected handler
    if (this._drawType === BONE_PROPS.STANDARD)
      this.__std(this.SELECTED_COLOR);
    else
      this.__drawCustom(this.SELECTED_COLOR);

    this._isSelected = true;
  }

  /**
   * Deselect this bone
   */
  public deselect(): void
  {
    if (this._drawType === BONE_PROPS.STANDARD)
      this.__std(this.FILL_COLOR);
    else
      this.__drawCustom(this.FILL_COLOR);

    this._isSelected = false;
  }

  // This is only to satisfy the Linkable type - a single bone has no end-effector, but a chain and connector do.
  public moveEndEffector(toX: number, toY: number, isPinned: boolean): boolean
  {
    return true;
  }

  /**
   * Deep-six this bone :)
   */
  public destruct(): void
  {
    this.init();

    this.disableMouseEvents();

    this._onInitial       = null;
    this._onFinal         = null;
    this._rollOverHandler = null;
    this._rollOutHandler  = null;
    this._selectedHandler = null;
  }

  /**
   * Enable mouse events on this bone
   */
  public enableMouseEvents(): void
  {
    this.ENABLED               = true;
    this._graphics.interactive = true;

    this._graphics.
       on('mouseover', this._rollOverBone)
      .on('mouseout', this._rollOutBone  )
      .on('mouseup', this._selectBone    );
  }

  /**
   * Disable mouse events on this bone
   */
  public disableMouseEvents(): void
  {
    this.ENABLED = false;

    this._graphics.off('mouseover', this._rollOverBone )
      .off('mouseout', this._rollOutBone)
      .off( 'mouseup', this._selectBone );
  }

  /**
   * Initialize (reset) this bone
   */
  public init(): void
  {
    this.NAME            = "Bone";
    this.ID              = 0;
    this.NEXT            = null;
    this.PREV            = null;
    this.ENABLED         = false;
    this.RENDERABLE      = true;
    this.INTERPOLATE     = false;
    this.IS_ROOT         = false;
    this.IS_END          = false;
    this.IS_STRETCH      = false;
    this.LINE_THICKNESS  = 1;
    this.LINE_COLOR      = "0x666666";
    this.FILL_COLOR      = "0x999999";
    this.ROLL_OVER_COLOR = "0x6699cc";
    this.SELECTED_COLOR  = "0xff3333";

    this._x0         = 0;
    this._y0         = 0;
    this._x1         = 0;
    this._y1         = 0;
    this._xL         = 0;
    this._yL         = 0;
    this._xR         = 0;
    this._yR         = 0;
    this._length     = 0;
    this._deltaX     = 0;
    this._deltaY     = 0;
    this._flare      = 0;
    this._angle      = 0;
    this._isSelected = false;
    this._drawing    = false;
    this._drawType   = BONE_PROPS.STANDARD;
    this._fk         = BONE_PROPS.NONE;

    this._self = this;

    this._graphics.clear();
  }

  /**
   * Assign a handler to a specific mouse interaction
   *
   * @param type Mouse interaction type
   *
   * @param f Handler function
   */
  public setHandler(type: string, f: (b: BoneModel) => void): void
  {
    switch (type)
    {
      case BONE_PROPS.BONE_ROLL_OVER:
        this._rollOverHandler = f;

      case BONE_PROPS.BONE_ROLL_OUT:
        this._rollOutHandler = f;

      case BONE_PROPS.BONE_SELECTED:
      this._selectedHandler = f;
    }
  }

  protected __setSkinPoints(upper: boolean = false): void
  {
    // Currently using four skin points with hardcoded parameter that determines length away from initial/terminal bone points.
    // Return all four if skin type is SPLINE_BONE, upper two for SPLINE_CHAIN and upper = true, lower two for SPLINE_CHAIN and
    // upper = false.

    if (this._length === 0) {
      return;
    }

    // clear existing points
    this._skinPoints.length = 0;

    // TODO - make this a settable parameter post-beta
    const d: number = 0.065 * this._length;

    // unit vector in direction of bone
    const uX: number    = this._deltaX / this._length;
    const PI_2: number  = 0.5 * Math.PI;
    const PI_4: number  = 0.25 * Math.PI;
    const PI_8: number  = 0.5 * PI_4;

    let angle: number = this._angle - PI_2 - PI_8;
    let c: number     = Math.cos(angle);
    let s: number     = Math.sin(angle);

    // skin point oriented along the positive x-axis with initial point at origin
    let sx: number = d*uX;
    let sy: number = 0;

    // Compute one point and the rest follow by translation and reflection
    switch (this._skinType)
    {
      case SKIN_TYPE.SPLINE_BONE:
        this._skinPoints.push(c*sx - s*sy);
        this._skinPoints.push(s*sx + s*sy);

        this._skinPoints.push(-this._skinPoints[0] + this._length);
        this._skinPoints.push(this._skinPoints[1]);

        this._skinPoints.push(-this._skinPoints[0] + this._length);
        this._skinPoints.push(-this._skinPoints[1]);

        this._skinPoints.push(this._skinPoints[0]);
        this._skinPoints.push(-this._skinPoints[1]);

        break;

      case SKIN_TYPE.SPLINE_CHAIN:

        // TODO
        if (upper)
        {

        }
        else
        {

        }
        break;
    }
  }

  protected __isInLimit(lower: number, upper: number, child: number ): boolean
  {
    // compensate for periodicity in using absolute orientations - there are better ways, but this is conceptually simple
    if (lower > upper)
    {
      if (child >= Math.PI && child <= Bone.TWO_PI)
        return child >= lower && child <= (Bone.TWO_PI + upper);
      else
        return (child + Bone.TWO_PI) >= lower && child <= upper;
    }
    else
      return child >= lower && child <= upper;
  }

  // draw a 'standard' bone
  protected __std(color: string): void
  {
    this._graphics.clear();
    this._graphics.lineStyle(this.LINE_THICKNESS, this.LINE_COLOR);

    if (this._skinType === SKIN_TYPE.NONE || !this.SKIN_ONLY)
    {
      // Draw the bone
      this._graphics.beginFill(color);

      this._angle = Math.atan2(this._deltaY, this._deltaX);

      // create the two 'flare' points to draw the bone
      const c: number = Math.cos(Bone.THETA);
      const s: number = Math.sin(Bone.THETA);

      this._xL = this._flare * c;
      this._yL = -this._flare * s;
      this._xR = this._flare * c;
      this._yR = this._flare * s;

      this._graphics.moveTo(0, 0);
      this._graphics.lineTo(this._xL, this._yL);
      this._graphics.lineTo(this._length, 0);
      this._graphics.lineTo(this._xR, this._yR);
      this._graphics.lineTo(0, 0);

      this._graphics.endFill();

      this._graphics.x = this._x0;
      this._graphics.y = this._y0;

      this._graphics.rotation = this._angle;
      this._drawing           = false;
    }

    if (this._skinType === SKIN_TYPE.SPLINE_BONE)
    {
      // skin completely surrounds the bone and is drawn into the bone's graphic context; first, access the spline control points
      this._splineSkin        = this._splineSkin || new TSMT$CubicBezierSpline();
      this._splineSkin.closed = true;
      this._splineSkin.clear();

      if (this._skinPoints.length == 0) {
        this.__setSkinPoints();
      }

      const n: number = this._skinPoints.length / 2;
      let i: number;
      let j: number = 0;

      for (i = 0; i < n; ++i)
      {
        this._splineSkin.addControlPoint(this._skinPoints[j], this._skinPoints[j+1]);

        j += 2;
      }

      let bezier: TSMT$CubicBezier;

      // there is one extra segment for a closed-loop spline
      for (i = 0; i < n; ++i)
      {
        bezier = this._splineSkin.getCubicSegment(i);

        this._graphics.moveTo(bezier.x0, bezier.y0);
        this._graphics.bezierCurveTo(bezier.cx, bezier.cy, bezier.cx1, bezier.cy1, bezier.x1, bezier.y1);
      }
    }
  }

  // draw bone with custom template, which serves as a primitive skin
  protected __drawCustom(color: string): void
  {
    if (this._template)
    {
      this._graphics.clear();
      this._graphics.lineStyle(this.LINE_THICKNESS, this.LINE_COLOR);
      this._graphics.beginFill(color);

      const points: Array<number> = this._template.points;
      const n: number             = points.length / 2;
      let i: number;
      let j: number = 2;

      this._graphics.moveTo(points[0], points[1]);

      // first half
      for (i = 1; i < n; ++i)
      {
        this._graphics.lineTo(points[j], points[j+1]);
        j += 2;
      }

      // symmetry
      j -= 4;
      for (i = 1; i < n; ++i)
      {
        this._graphics.lineTo(points[j], -points[j+1]);
        j -= 2;
      }
    }
  }

  // handle mouse roll over
  protected __onRollOver(e: MouseEvent): void
  {
    if (this.ENABLED && this.RENDERABLE && !this._isSelected)
    {
      this._mouseEvent = BONE_PROPS.BONE_ROLL_OVER;

      if (this._drawType === BONE_PROPS.STANDARD)
        this.__std(this.ROLL_OVER_COLOR);
      else
        this.__drawCustom(this.ROLL_OVER_COLOR);

      if (this._rollOverHandler != null) {
        this._rollOverHandler(this._self);
      }
    }
  }

  // handle mouse roll out
  protected __onRollOut(e: MouseEvent): void
  {
    if (this.ENABLED && this.RENDERABLE && !this._isSelected)
    {
      this._mouseEvent = BONE_PROPS.BONE_ROLL_OUT;

      if (this._drawType === BONE_PROPS.STANDARD)
        this.__std(this.FILL_COLOR);
      else
        this.__drawCustom(this.FILL_COLOR);

      if (this._rollOutHandler != null) {
        this._rollOutHandler(this._self);
      }
    }
  }

  // handle bone selected (mouse click)
  protected __onSelected(e: MouseEvent): void
  {
    if (this.ENABLED && this.RENDERABLE)
    {
      this._mouseEvent = BONE_PROPS.BONE_SELECTED;
      this._isSelected = true;

      if (this._drawType === BONE_PROPS.STANDARD)
        this.__std(this.SELECTED_COLOR);
      else
        this.__drawCustom(this.SELECTED_COLOR);

      if (this._selectedHandler != null ) {
        this._selectedHandler(this._self);
      }
    }
  }
}
