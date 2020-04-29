/**
 * Copyright 2020 Jim Armstrong (www.algorithmist.net)
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
 */

/**
 * This directive manages the creation of a bone chain, movement of the end-effector, and then illustrates
 * one step at a time of the RFK algorithm, a variant of Cyclic Coordinate Descent.
 *
 * @author Jim Armstrong (www.algorithmist.net)
 *
 * @version 1.0
 */

import {
  Directive,
  ElementRef,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';

import * as PIXI from 'pixi.js/dist/pixi.js';

import { Chain      } from '../libs/rigs/chain';
import { BoneModel  } from '../interfaces/bone-model';
import { IGraphics  } from '../interfaces/graphics';
import { BONE_PROPS } from '../interfaces/bone-properties';

import {
  fromEvent,
  Subscription
} from 'rxjs';

import Rectangle = PIXI.Rectangle;

@Directive({selector: '[ccd-steps]'})
export class CcdStepsDirective implements OnDestroy
{
  @Output()
  public onBoneAdded: EventEmitter<string>;

  @Output()
  public onTerminate: EventEmitter<string>;

  protected _domContainer: HTMLDivElement;        // Container for PIXI Canvas
  protected _rect: Rectangle;                     // display area bounding rectangle

  // PIXI app and stage references
  protected _app: PIXI.Application;
  protected _stage: PIXI.Container;
  protected _width: number;
  protected _height: number;

  // Containers
  protected _chainContainer: PIXI.Container;
  protected _markerContainer: PIXI.Container;

  // Specific graphic contexts
  protected _endEffectorContext: PIXI.Graphics;

  // Visual representations of each bone
  protected _bones: Array<PIXI.Graphics>;

  // reference to function used to handle clicks in the display area
  protected _clickFcn: Function;

  // static PIXI options #C3E4ED
  protected static OPTIONS: Object = {
    backgroundColor: 0xF0F8FF,
    antialias: true
  };

  protected _count: number;               // point counter
  protected _bone: BoneModel;             // reference to a single bone
  protected _chain: Chain;                // primary bone chain
  protected _isTerminated: boolean;       // true when chain is terminated
  protected _selectedBone: BoneModel;     // Reference to current user-selected Bone
  protected _selectedOrientation: number; // initial orientation of selected bone;

  protected _subscription: Subscription;

  // ik-solution
  protected _endEffectorMoved: boolean;   // has end-effector been moved
  protected _targetX: number;             // terminal bone target, x-coordinate
  protected _targetY: number;             // terminal bone target, y-coordinate
  protected _curTargetX: number;          // current target at k-th stage, x-coordinate
  protected _curTargetY: number;          // current target at k-th stage, y-coordinate
  protected _termX: number;               // cache previous bone terminal x-coord
  protected _termY: number;               // cache previous bone terminal y-coord
  protected _recordX: Array<number>;      // record new target x-coordinates
  protected _recordY: Array<number>;      // record new target y-coordinates
  protected _iterations: number;          // count the number of iterations
  protected _isTarget: boolean;           // target phase?
  protected _finished: boolean;           // moved as close as possible to end-effector
  protected _deltaX: number;              // delta-x between terminal bone and end-effector x-coords, post-solution
  protected _deltaY: number;              // delta-y between terminal bone and end-effector y-coords, post-solution
  protected _stop: number;                // stopping criteria in terms of squared distance between end of chain and end-effector
  protected _cycles: number;              // # cycles through solver
  protected _maxCycles: number;           // maximum number allowed cycles

  constructor(protected _elRef: ElementRef)
  {
    this._domContainer = <HTMLDivElement> this._elRef.nativeElement;

    this._width  = this._elRef.nativeElement.clientWidth;
    this._height = this._elRef.nativeElement.clientHeight;

    this._bones = new Array<PIXI.Graphics>();

    this._clickFcn = (evt: any) => this.__processJoint(evt.x - this._rect.left, evt.y - this._rect.top);

    this._elRef.nativeElement.addEventListener('click', this._clickFcn);

    // This shows how to convert the HostListener from other demos to RxJS fromEvent
    this._subscription = fromEvent(document, 'keyup').subscribe( (evt: KeyboardEvent) => this.__keyHandler(evt) );

    this._count            = 0;
    this._bone             = null;
    this._chain            = new Chain();
    this._isTerminated     = false;
    this._endEffectorMoved = false;
    this._isTarget         = false;
    this._finished         = false;

    this._recordX = new Array<number>();
    this._recordY = new Array<number>();

    this.onBoneAdded = new EventEmitter<string>();
    this.onTerminate = new EventEmitter<string>();

    // accept up to 6px squared distance between terminal bone terminal point and end-effector
    this._stop = 6;

    // no more than 10 cycles
    this._maxCycles = 10;
    this._cycles    = 0;

    this.__pixiSetup();
  }

  public ngOnInit(): void
  {
    this._rect = this._elRef.nativeElement.getBoundingClientRect();
  }

  public ngOnDestroy(): void
  {
    if (this._elRef.nativeElement.hasEventListner('click')) {
      this._elRef.nativeElement.removeEventListener('click', this._clickFcn);
    }

    this._subscription.unsubscribe();
  }

  public next(): void
  {
    let bone: BoneModel;
    let curX: number;
    let curY: number;

    if (this._isTarget)
    {
      if (this._iterations < this._chain.size)
      {
        const index: number = this._chain.size - this._iterations - 1;
        bone                = this._chain.getBone(index);

        // angle needed to rotate current bone to align with current target
        const dX: number  = this._curTargetX - bone.initX;
        const dY: number  = this._curTargetY - bone.initY;
        const rot: number = Math.atan2(dY, dX);

        // compute new target based on current bone's length
        const l: number  = bone.length;
        this._curTargetX = this._curTargetX - l * Math.cos(rot);
        this._curTargetY = this._curTargetY - l * Math.sin(rot);

        const g: PIXI.Graphics = this._markerContainer.getChildAt(this._iterations);
        g.beginFill('0x00ff00');
        g.drawCircle(this._curTargetX, this._curTargetY, 5);
        g.endFill();

        // record new target for next phase unless at last step when we only need the target value
        if (index > 0)
        {
          this._recordX[index-1] = this._curTargetX;
          this._recordY[index-1] = this._curTargetY;
        }

        this._iterations++;
      }
      else
      {
        // target phase complete ...
        this._isTarget   = false;
        this._finished   = false;
        this._iterations = 0;

        // these coords are computed in reverse order
        this._recordX[this._chain.size-1] = this._curTargetX;
        this._recordY[this._chain.size-1] = this._curTargetY;
      }
    }
    else
    {
      if (this._iterations < this._chain.size)
      {
        // position bones to targets
        bone = this._chain.getBone(this._iterations);

        // if first iter., get deltas between current target and init coordinates of root bone.  (significant) Nonzero deltas mean
        // the end-effector does not reach the final target
        if (this._iterations === 0)
        {
          curX         = bone.initX;
          curY         = bone.initY;
          this._termX  = this._recordX[0];
          this._termY  = this._recordY[0];
          this._deltaX = this._curTargetX - curX;
          this._deltaY = this._curTargetY - curY;

          // root bone is fixed - modify only terminal coordinates for root bone
          this._termX -= this._deltaX;
          this._termY -= this._deltaY;
          bone.setTerminal(this._termX, this._termY);
          bone.draw();
        }
        else if (this._iterations < this._chain.size-1)
        {
          curX        = this._termX; // this._recordX[this._iterations-1] - this._deltaX;
          curY        = this._termY; // this._recordY[this._iterations-1] - this._deltaY;
          this._termX = this._recordX[this._iterations]   - this._deltaX;
          this._termY = this._recordY[this._iterations]   - this._deltaY;

          bone.setInitial(curX, curY, false);
          bone.setTerminal(this._termX, this._termY);
          bone.draw();
        }
        else
        {
          // final bone is initiated at last bone's terminal point and oriented towards the end-effector
          bone.setInitial(this._termX, this._termY, false);

          let dX: number = this._targetX - this._termX;
          let dY: number = this._targetY - this._termY;

          bone.orientation = Math.atan2(dY, dX);
          bone.draw();
        }

        this._iterations++;
      }
      else
      {
        // test if current end effector is close enough to target
        const dX: number        = this._targetX - this._chain.terminalX;
        const dY: number        = this._targetY - this._chain.terminalY;
        const error: number     = (dX*dX + dY*dY);
        const finished: boolean = error <= this._stop || + this._cycles >= this._maxCycles;

        if (!finished)
        {
          this._curTargetX = this._targetX;
          this._curTargetY = this._targetY;

          let i: number;
          let g: PIXI.Graphics;
          for (i = 0; i < this._chain.size; ++i)
          {
            g = this._markerContainer.getChildAt(i);
            g.clear();
          }

          this._iterations = 0;
          this._isTarget   = true;

          this._cycles++;
        }
        else
        {
          this.onTerminate.emit('ik-solve-complete');
        }
      }
    }
  }

  protected __keyHandler(event: KeyboardEvent)
  {
    if (event.code.toLowerCase() === 'space') {
      this.__terminateChain();
    }
  }

  protected __pixiSetup(): void
  {
    const options = {width: this._width, height: this._height, ...CcdStepsDirective.OPTIONS};
    this._app     = new PIXI.Application(options);

    this._domContainer.appendChild(this._app.view);

    this._stage             = this._app.stage;
    this._stage.interactive = true;

    this._chainContainer     = new PIXI.Container();
    this._markerContainer    = new PIXI.Container();
    this._endEffectorContext = new PIXI.Graphics();

    this._stage.addChild(this._chainContainer);
    this._stage.addChild(this._endEffectorContext);
    this._stage.addChild(this._markerContainer);
  }

  protected __processJoint(x: number, y: number): void
  {
    if (!this._isTerminated)
    {
      if (this._count === 0)
      {
        const g1: IGraphics = new PIXI.Graphics();
        this._chainContainer.addChild(g1);

        this._bone      = this._chain.createBone(g1);
        this._bone.NAME = `Bone${this._count}`;
        this._bone.ID   = this._count;

        // completely turn off all internal mouse events until chain is completed
        this._bone.disableMouseEvents();

        // initial joint coordinates
        this._bone.setInitial(x, y);
        this._isTerminated = false;
      }
      else
      {
        // terminate current bone
        this._bone.setTerminal(x, y);
        this._bone.setHandler(BONE_PROPS.BONE_SELECTED, (b: BoneModel) => this.__onBone(b));
        this._bone.draw();

        // begin new bone
        const g2: IGraphics = new PIXI.Graphics();
        this._chainContainer.addChild(g2);

        this._bone      = this._chain.createBone(g2);
        this._bone.NAME = `Bone${this._count}`;
        this._bone.ID   = this._count;

        this._bone.disableMouseEvents();
        this._bone.setInitial(x, y);

        this.onBoneAdded.emit('add');
      }

      this._count++;
    }
    else
    {
      if (!this._endEffectorMoved)
      {
        // moving end-effector
        this.__drawEndEffector(x, y);

        this._endEffectorMoved = true;
        this._isTarget         = true;
        this._iterations       = 0;
        this._cycles           = 0;
        this._targetX          = x;
        this._targetY          = y;
        this._curTargetX       = x;
        this._curTargetY       = y;

        // markers for target phase of RFK
        let i: number;

        for (i = 0; i < this._chain.size; ++i) {
          this._markerContainer.addChild(new PIXI.Graphics());
        }

        this.onTerminate.emit('end-effector');
      }
    }
  }

  protected __terminateChain():void
  {
    if (!this._isTerminated)
    {
      this._isTerminated = true;

      // currently drawn bone is invalid
      this._chain.pop();

      // enable all bones
      this._chain.enabled = true;

      // Terminal bone of chain is current bone
      this._bone = this._chain.terminal;

      // draw the end effector and place it at the end of the chain
      this.__drawEndEffector(this._bone.terminalX, this._bone.terminalY);

      this.onTerminate.emit('bone');
    }
  }

  protected __drawEndEffector(x: number, y: number): void
  {
    this._endEffectorContext.clear();
    this._endEffectorContext.lineStyle(4, '0xff6600');

    this._endEffectorContext.moveTo(x-10, y);
    this._endEffectorContext.lineTo(x+10, y);
    this._endEffectorContext.moveTo(x, y-10);
    this._endEffectorContext.lineTo(x, y+10);
  }

  protected __onBone(b: BoneModel): void
  {
    this._selectedBone        = b;
    this._selectedOrientation = b.orientation;
  }
}
