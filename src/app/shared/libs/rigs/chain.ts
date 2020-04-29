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

import { IChain     } from '../../interfaces/chain-model';
import { BONE_PROPS } from '../../interfaces/bone-properties';
import { BoneModel  } from '../../interfaces/bone-model';

import {
  Bone,
  SKIN_TYPE
} from './bone';

import { BoneTemplate } from './bone-template';
import { IGraphics    } from '../../interfaces/graphics';
import { Linkable     } from '../../interfaces/linkable';
import { Connector    } from './connector';

// default IK solver if none assigned
import { IkSolver } from '../../interfaces/ik-solver';
import { ccdBasic } from '../ik-solvers/ccd-basic';

/**
 * Implementation of a lightweight FK/IK bone chain; interactivity is disabled by default so that mouse
 * interaction does not interfere with a GUI driving chain generation.  After the chain is completed,
 * enable it to react to mouse events.  An IK solver should be assigned before attempting to move the
 * end effector of the chain; a default solver is assigned if the user elects not to do so.
 *
 * @author Jim Armstrong
 *
 * @version 1.0
 */

export class Chain implements IChain
{
  // properties
  public NAME: string;                     // name associated with this chain
  public ID: number;                       // numeric ID associated with this chain
  public REDRAW_ON_SOLVE: boolean;         // true if bones are redrawn after IK solve

  // core
  protected _bones: Array<BoneModel>;      // collection of bones
  protected _count: number;                // current bone count
  protected _current: BoneModel;           // reference to currently active bone based on mouse action
  protected _previous: BoneModel;          // reference to previously selected bone
  protected _selected: BoneModel;          // reference to currently selected bone
  protected _rootBone: BoneModel;          // permanent reference to root bone in the chain
  protected _terminalBone: BoneModel;      // permanent reference to the termainal bone in the chain
  protected _mouseEvent: string;           // type of bone mouse event
  protected _linkedTo: Linkable;           // what this chain is linked to (FK)
  protected _linkedFrom: Linkable;         // what this chain is linked from (IK)
  protected _skinType: SKIN_TYPE;          // type of skin applied to all bones in the chain

  // drawing properties (apply to all bones in the chain)
  protected _lineThickness: number;        // line thickness for drawing
  protected _lineColor: string;            // line color
  protected _fillColor: string;            // fill color
  protected _rollOverColor: string;        // mouse over fill color
  protected _selectedColor: string;        // selected fill color

  // end effector
  protected _isPinned: boolean;            // true if end-effector is pinned
  protected _ikSolver: IkSolver;           // reference to assigned IK solver

  // chains linked forward to this one
  protected _forward: Array<Linkable>;

  constructor()
  {
    this.__init();
  }

  protected __init(): void
  {
    this.NAME            = "Chain";
    this.ID              = 0;
    this.REDRAW_ON_SOLVE = false;

    this._bones         = new Array<BoneModel>();
    this._forward       = new Array<Linkable>();
    this._current       = null;
    this._selected      = null;
    this._rootBone      = null;
    this._terminalBone  = null;
    this._linkedTo      = null;
    this._linkedFrom    = null;
    this._lineThickness = 1;
    this._lineColor     = "0x666666";
    this._fillColor     = "0x999999";
    this._rollOverColor = "0x6699cc";
    this._selectedColor = "0xff3333";
    this._mouseEvent    = BONE_PROPS.BONE_NONE;
    this._skinType      = SKIN_TYPE.NONE;

    this._count = 0;

    this._isPinned = false;
  }

  /**
   * Access the number of bones in the chain
   */
  public get size(): number
  {
    return this._count;
  }

  // deprecated
  public get mouseEvent(): string
  {
    return this._mouseEvent;
  }

  /**
   * Access the x-coordinate of the root bone in the chain
   */
  public get initX(): number
  {
    return this._rootBone?.initX;
  }

  /**
   * Access the y-coordinate of the root bone in the chain
   */
  public get initY(): number
  {
    return this._rootBone?.initY;
  }

  /**
   * Access the x-coordinate of the terminal bone in the chain
   */
  public get terminalX(): number
  {
    return this._terminalBone?.terminalX;
  }

  /**
   * Access the y-coordinate of the terminal bone in the chain
   */
  public get terminalY(): number
  {
    return this._terminalBone?.terminalY;
  }

  /**
   * Access the orientation of the root bone in the chain - considered to be the chain's orientation
   */
  public get orientation(): number
  {
    return this._rootBone.orientation;
  }

  /**
   * Access the orientation of the terminal bone in the chain
   */
  public get endOrientation(): number
  {
    return this._terminalBone.orientation;
  }

  /**
   * Access the forward linkage of this chain
   */
  public get linkedTo(): Linkable
  {
    return this._linkedTo;
  }

  /**
   * Access the inverse linkage of this chain
   */
  public get linkedFrom(): Linkable
  {
    return this._linkedFrom;
  }

  /**
   * Access the root bone in the chain
   */
  public get root(): BoneModel
  {
    return this._rootBone;
  }

  /**
   * Access the terminal bone in the chain
   */
  public get terminal(): BoneModel
  {
    return this._terminalBone;
  }

  /**
   * Access the skin type of the chain
   */
  public get skinType(): SKIN_TYPE
  {
    return this._skinType;
  }

  /**
   * Assign a skin type to this chain
   *
   * @param value Type of skinning for the chain, which is applied to each bone in the chain
   */
  public set skinType(value: SKIN_TYPE)
  {
    this._skinType = value !== undefined && value != null ? value : this._skinType;

    this._bones.forEach( (bone: BoneModel): void => {bone.skinType = this._skinType} );
  }

  /**
   * Access a bone in the chain by its zero-based index
   *
   * @param i Index of the bone (root is zero)
   */
  public getBone(i:number): BoneModel
  {
    return this._bones[i];
  }

  /**
   * Assign a forward linkage to this chain
   *
   * @param c Forward linkage; FK transforms are propagated to this linkage
   */
  public set linkedTo(c: Linkable)
  {
    if (c !== undefined && c != null)
    {
      this._linkedTo = c;
      this._terminalBone.linkedTo = c;
    }
  }

  /**
   * Assign an inverse linkage to this chain
   *
   * @param c Inverse linkage; IK is propagated to this linkage
   */
  public set linkedFrom(c: Linkable)
  {
    if (c !== undefined && c != null)
    {
      this._linkedFrom = c;
      this._rootBone.linkedFrom = c;
    }
  }

  /**
   * Assign an IK solver for this chain
   *
   * @param solver Reference to a function that implements IK solutions for this chain
   */
  public set ikSolver(solver: IkSolver)
  {
    if (solver !== undefined && solver != null) {
      this._ikSolver = solver;
    }
  }

  // following setters affect all bones in the chain; TODO better way to communicate by method name

  /**
   * Enable all bones in the chain for mouse events
   *
   * @param enable True if mouse events enabled for all bones in the chain
   */
  public set enabled(enable: boolean)
  {
    let i: number;
    let b: BoneModel;

    for (i = 0; i < this._count; ++i)
    {
      b = this._bones[i];
      if (enable)
        b.enableMouseEvents();
      else
        b.disableMouseEvents();
    }
  }

  /**
   * Make all bones in the chain renderable
   *
   * @param enable True if bones are to be rendered
   */
  public set renderable(enable: boolean)
  {
    this._bones.forEach( (bone: BoneModel): void => {
      bone.RENDERABLE = enable;
    });
  }

  /**
   * Assign the draw type for this bone (deprecated - template assignment will force the issue)
   *
   * @param s Standard or Custom draw type
   */
  public set drawType(s: BONE_PROPS)
  {
    this._bones.forEach( (bone: BoneModel): void => {
      bone.drawType = s;
    });
  }

  // These are to be deprecated in favor of a single draw-properties object; they were originally added for rapid testing
  public set lineThickness(n: number)
  {
    this._lineThickness = n;

    this._bones.forEach( (bone: BoneModel): void => {
      bone.LINE_THICKNESS = n;
    });
  }

  public set lineColor(c: string)
  {
    this._lineColor = c;

    this._bones.forEach( (bone: BoneModel): void => {
      bone.LINE_COLOR = c;
    });
  }

  public set fillColor(c: string)
  {
    this._fillColor = c;

    this._bones.forEach( (bone: BoneModel): void => {
      bone.FILL_COLOR = c;
    });
  }

  public set rollOverColor(c: string)
  {
    this._rollOverColor = c;

    this._bones.forEach( (bone: BoneModel): void => {
      bone.ROLL_OVER_COLOR = c;
    });
  }

  public set selectedColor(c: string)
  {
    this._selectedColor = c;

    this._bones.forEach( (bone: BoneModel): void => {
      bone.SELECTED_COLOR = c;
    });
  }

  /**
   * Link one chain to another chain (or Connector) to propagate FK motion
   *
   * @param c Forward linkage
   *
   * @param orient True if the connection is automatically oriented to the terminal bone of this chain
   */
  public link(c: Linkable, orient: boolean=true): void
  {
    if (c instanceof Connector)
    {
      // TODO - implement connector-specific linkage as the link is to a specific joint inside the connector
    }

    // Note that any item linked forward must implement the IChain Interface
    if (c != null)
    {
      this._forward.push(c);

      this.linkedTo = c;
      c.linkedFrom  = this;

      // snap chain to end-effector location with optional matching of orientation
      const endX: number = this._terminalBone.terminalX;
      const endY: number = this._terminalBone.terminalY;

      if (orient)
        c.moveAndRotate(endX, endY, this._terminalBone.orientation - c.endOrientation);
      else
        c.move(endX, endY);
    }
  }

  /**
   * Unlink all forward linkages
   */
  public unlink(): void
  {
    this._forward.length = 0;
  }

 /**
  * Add a bone to this Chain; any bone-specific handlers should be assigned outside this class
  *
  * @param b Reference to BoneModel to be added
  */
  public addBone(b: BoneModel): void
  {
    // set the skin type for the bone
    b.skinType = this._skinType;

    this._bones[this._count] = b;
    this._previous           = (this._count === 0) ? null : this._current;
    this._current            = b;

    this._current.IS_ROOT = (this._count === 0);
    this._current.IS_END  = true;

    if (this._count > 0)
    {
      this._previous.IS_END = false;
      this._previous.NEXT   = this._current;
      this._current.PREV    = this._previous;
      this._terminalBone    = this._current;
    }
    else
    {
      this._rootBone     = this._current;
      this._terminalBone = this._current;
    }

    this._count++;
  }

 /**
  * Add a bone at the specified joint coordinates
  *
  * @param g A Graphics context in which to render the bone
  *
  * @param x0 x-coordinate of initial joint
  *
  * @param y0 y-coordinate of initial joint
  *
  * @param x1 x-coordinate of terminal joint
  *
  * @param y1 y-coordinate of terminal joint
  *
  * @param name bone name
  *
  * @param id bone id
  *
  * @param type bone type (for drawing)
  *
  * @param renderable true if the bone is renderable
  */
  public addBoneAt(
    g: IGraphics,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    name: string,
    id:number,
    type: BONE_PROPS,
    template: BoneTemplate=null,
    renderable: boolean=true
  ): BoneModel
  {
    const b: BoneModel = new Bone(g);

    b.NAME       = name;
    b.ID         = id;
    b.drawType   = type;
    b.RENDERABLE = renderable;

    if (type === BONE_PROPS.CUSTOM && template != null)
    {
      b.template = template;
    }
    else
    {
      b.setInitial(x0, y0);
      b.setTerminal(x1, y1);
    }

    this.addBone(b);

    return b;
  }

 /**
  * Create a new bone, add that bone to the chain, and return a reference to the created bone - used for GUI's that
  * create bones interactively
  */
  public createBone(g: IGraphics): BoneModel
  {
    const b: Bone = new Bone(g);

    this.addBone(b);

    return b;
  }

  /**
   * Draw the entire chain
   */
  public draw(): void
  {
    this._bones.forEach( (bone: BoneModel): void => {
      bone.RENDERABLE = true;
      bone.draw();
    });
  }

 /**
  * Remove the bone off the end of the chain
  */
  public pop(): void
  {
    let b: BoneModel = this._bones.pop();

    // destroy the bone 
    b.destruct();

    this._count               = this._bones.length;
    this._terminalBone        = this._bones[this._count-1];
    this._terminalBone.IS_END = true;
    this._terminalBone.NEXT   = null;
  }

 /**
  * Invalidation; chain orientation has been externally changed - anything linked forward is no longer valid
  * in position or orientation
  */
  public invalidate(): void
  {
    // note - an optional argument will be added in the future to force orientation to match the chain
    const links: number = this._forward.length;

    if (links > 0)
    {
      // end-effector coordinates
      const endX: number = this.terminalX;
      const endY: number = this.terminalY;

      let i: number;
      let c: Linkable;
      let dA: number;

      for (i = 0; i < links; ++i)
      {
        c  = this._forward[i];
        dA = this.endOrientation - c.orientation;

        c.moveAndRotate(endX, endY, dA);
      }
    }
  }

 /**
  * Select or highlight the root bone of the chain - no handlers are fired
  */
  public selectRoot(): void
  {
    this._rootBone.select();
  }

 /**
  * Move the root bone of the chain - FK causes remainder of chain to move
  *
  * @param toX new x-coordinate
  *
  * @param toY new y-coordinate
  */
  public move(toX: number, toY: number): void
  {
    this._rootBone.moveInitial(toX, toY);
  }

  /**
   * Rotate the root bone of the chain by the input delta angle
   *
   * @param deltaAngle delta angle
   */
  public rotate(deltaAngle: number): void
  {
    this._rootBone.rotate(deltaAngle);
  }

 /**
  * Move the root bone of the chain and rotate by the input delta angle; the root bone is moved to new coordinates; this
  * is the only bone in the chain that may have its initial joint directly translated.
  *
  * @param toX new x-coordinate
  *
  * @param toY new y-coordinate
  *
  * @param deltaAngle delta angle
  */
  public moveAndRotate(toX: number, toY: number, deltaAngle: number): void
  {
    this._rootBone.moveAndRotate(toX, toY, deltaAngle, Math.cos(deltaAngle), Math.sin(deltaAngle));
  }

  // change a connector's orientation by the input delta angle (radians in the range [0,2pi]
  public offsetOrientation(deltaAngle: number) :void
  {
    // TODO
  }

  /**
   * Move the end effector of this chain; IK solver determines if move can be fully resolved without breaking the chain.
   * Otherwise, the solver moves as close as possible to the desired coordinates.
   *
   * @param toX Desired x-coordinate of end effector
   *
   * @param toY Desired y-coordinate of end effector
   *
   * @param isPinned True if the effector is pinned and the move is interpreted as moving the root bone of the chain while
   * keeping its terminal coordinates fixed.
   */
  public moveEndEffector(toX: number, toY: number, isPinned: boolean = false): boolean
  {
    this._ikSolver = this._ikSolver !== undefined && this._ikSolver != null ? this._ikSolver : ccdBasic;

    // ideal case for target coordinates
    let targetX: number   = toX;
    let targetY: number   = toY;
    let resolved: boolean = true;

    // If moving the root and this chain has a reverse linkage, the IK solution must be first resolved through all prior linkages
    if (this._linkedFrom != null && isPinned)
    {
      // note - this has not been fully tested ...
      resolved = this._linkedFrom.moveEndEffector(toX, toY, isPinned);

      if (!resolved)
      {
        targetX = isPinned ? this._linkedFrom.initX : this._linkedFrom.terminalX;
        targetY = isPinned ? this._linkedFrom.initY : this._linkedFrom.terminalY;
      }

      // now, solve current chain to target; no need for a full solver if only one bone
      if (this.size == 1)
      {
        // just move; fk will propagate forward if necessary
        this.move(targetX, targetY);
      }
      else
      {
        // ik solution
        resolved = this._ikSolver(targetX, targetY, this, isPinned, null);

        // redraw all bones if required
        if (this.REDRAW_ON_SOLVE) {
          this._bones.forEach( (bone: BoneModel): void => bone.draw() );
        }

        // propagate move forward (FK)
        if (!resolved)
        {
          targetX = isPinned ? this.initX : this.terminalX;
          targetY = isPinned ? this.initY : this.terminalY;
        }

        if (this._linkedTo != null) {
          this._linkedTo.move(targetX, targetY);
        }
      }
    }
    else
    {
      resolved = this._ikSolver(targetX, targetY, this, isPinned, null);

      // redraw all bones if required
      if (this.REDRAW_ON_SOLVE) {
        this._bones.forEach( (bone: BoneModel): void => bone.draw() );
      }

      // propagate move forward (FK)
      if (!resolved)
      {
        targetX = isPinned ? this.initX : this.terminalX;
        targetY = isPinned ? this.initY : this.terminalY;
      }

      if (this._linkedTo != null) {
        this._linkedTo.move(targetX, targetY);
      }
    }

    return resolved;
  }

 /**
  * destruct all bones in the chain, allowing the class instance to be marked for garbage collection
  */
  public  destruct(): void
  {
    // TODO
  }

  // handle end-of-fk propagation event -- get the type of FK motion and pass it onto all linked chains
  // delta-angle is passed forward from terminal bone in previous chain
  protected __onFKEnd(b: BoneModel, dA: number): void
  {
    const links:number = this._forward.length;

    if (links > 0)
    {
      // end-effector coordinates
      const endX: number = this.terminalX;
      const endY: number = this.terminalY;

      let i: number;
      let c: Linkable;

      switch (b.fkType)
      {
        case BONE_PROPS.FK_MOVE:
          for (i = 0; i < links; ++i) {
            this._forward[i].move(endX, endY);
          }
          break;

        case BONE_PROPS.FK_ROTATE:
          for (i = 0; i < links; ++i)
          {
            c = this._forward[i];
            c.moveAndRotate(endX, endY, dA);
          }
          break;
      }
    }
  }
}

