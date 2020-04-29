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
 * This directive manages display and interaction with a bone chain.
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

import {
  fromEvent,
  Subscription
} from 'rxjs';

import * as PIXI from 'pixi.js/dist/pixi.js';

import { Chain        } from '../libs/rigs/chain';
import { BoneModel    } from '../interfaces/bone-model';
import { BoneTemplate } from '../libs/rigs/bone-template';
import { IGraphics    } from '../interfaces/graphics';
import { BONE_PROPS   } from '../interfaces/bone-properties';

import Rectangle = PIXI.Rectangle;

@Directive({selector: '[ik-solver]'})
export class IkSolverDirective implements OnDestroy
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

  // Container for all bones in the chain
  protected _chainContainer: PIXI.Container;

  // Specific graphic contexts
  protected _handContext: PIXI.Graphics;

  // Visual representations of each bone
  protected _bones: Array<PIXI.Graphics>;

  // reference to function used to handle clicks in the display area
  protected _clickFcn: Function;

  // static PIXI options #C3E4ED
  protected static OPTIONS: Object = {
    backgroundColor: 0xF0F8FF,
    antialias: true
  };

  protected _keyUpSub: Subscription;

  protected _count: number;               // point counter
  protected _bone: BoneModel;             // reference to a single bone
  protected _chain: Chain;                // primary bone chain
  protected _hand: Chain;                 // single-link chain representing a hand bone
  protected _isTerminated: boolean;       // true when chain is terminated
  protected _selectedBone: BoneModel;     // Reference to current user-selected Bone
  protected _selectedOrientation: number; // initial orientation of selected bone;

  protected _dragging: boolean;           // true if dragging hand
  protected _data: PIXI.InteractionData;  // Pixi js data object while dragging
  protected _px: number;
  protected _py: number;
  protected _hx: number;
  protected _hy: number;

  protected _mouseDownHandler: (evt: PIXI.InteractionEvent) => void;
  protected _mouseUpHandler: (evt: PIXI.InteractionEvent) => void;
  protected _mouseMoveHandler: (evt: PIXI.InteractionEvent) => void;

  constructor(protected _elRef: ElementRef)
  {
    this._domContainer = <HTMLDivElement> this._elRef.nativeElement;

    this._width  = this._elRef.nativeElement.clientWidth;
    this._height = this._elRef.nativeElement.clientHeight;

    this._bones = new Array<PIXI.Graphics>();

    this._clickFcn = (evt: any) => this.__processJoint(evt.x - this._rect.left, evt.y - this._rect.top);

    this._elRef.nativeElement.addEventListener('click', this._clickFcn);

    this._keyUpSub     = fromEvent(document, 'keyup').subscribe( (evt: KeyboardEvent) => this.__keyHandler(evt) );

    this._count        = 0;
    this._bone         = null;
    this._chain        = new Chain();
    this._hand         = new Chain();
    this._isTerminated = false;
    this._dragging     = false;

    // we want to redraw the bone chain after an IK solution
    this._chain.REDRAW_ON_SOLVE = true;

    this._mouseDownHandler = (evt: PIXI.InteractionEvent) => this.__onMouseDown(evt);
    this._mouseUpHandler   = (evt: PIXI.InteractionEvent) => this.__onMouseUp(evt);
    this._mouseMoveHandler = (evt: PIXI.InteractionEvent) => this.__onMouseMove(evt);

    this.onBoneAdded = new EventEmitter<string>();
    this.onTerminate = new EventEmitter<string>();

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

    this._keyUpSub.unsubscribe();

    this._handContext
      .off('mousedown', this._mouseDownHandler)
      .off('mouseup', this._mouseUpHandler)
      .off('mousemove', this._mouseMoveHandler);
  }

  protected __keyHandler(event: KeyboardEvent): void
  {
    if (event.code.toLowerCase() === 'space') {
      this.__terminateChain();
    }
  }

  protected __onMouseDown(event: PIXI.InteractionEvent): void
  {
    if (this._isTerminated)
    {
      this._dragging = true;
      this._data     = event.data;
      this._px       = event.data.global.x;
      this._py       = event.data.global.y;
      this._hx       = this._hand.initX;
      this._hy       = this._hand.initY;
    }
  }

  protected __onMouseUp(event: PIXI.InteractionEvent): void
  {
    this._dragging = false;

    // Re-orient the hand to the terminal bone in the chain
    this._hand.rotate(this._chain.endOrientation - this._hand.orientation);
  }

  protected __onMouseMove(event: PIXI.InteractionEvent): void
  {
    if (this._dragging)
    {
      const dx: number = this._data.global.x - this._px;
      const dy: number = this._data.global.y - this._py;

      // move the ik chain end effector to the new target
      const resolved: boolean = this._chain.moveEndEffector(this._hx + dx, this._hy + dy);
    }
  }

  protected __pixiSetup(): void
  {
    const options = {width: this._width, height: this._height, ...IkSolverDirective.OPTIONS};
    this._app     = new PIXI.Application(options);

    this._domContainer.appendChild(this._app.view);

    this._stage             = this._app.stage;
    this._stage.interactive = true;

    this._chainContainer = new PIXI.Container();
    this._handContext    = new PIXI.Graphics();

    this._stage.addChild(this._chainContainer);
    this._stage.addChild(this._handContext);

    this.__handSetup();
  }

  protected __handSetup(): void
  {
    // A Biped hand is overkill for this purpose since we don't need a full-on Connector
    const t: BoneTemplate = new BoneTemplate();
    t.insert(0, 0);
    t.insert(10, 8);
    t.insert(15, 8);
    t.insert(15, 0);

    const hand: BoneModel = this._hand.addBoneAt(this._handContext, 30, 70, 30, 50, "hand", 0, BONE_PROPS.CUSTOM, t, true);
    hand.FILL_COLOR       = '0x228c22';

    // setup for dragging
    this._handContext.interactive = true;
    this._handContext.buttonMode  = true;

    this._handContext
      .on('mousedown', this._mouseDownHandler)
      .on('mouseup', this._mouseUpHandler)
      .on('mousemove', this._mouseMoveHandler);

    this._hand.NAME    = 'Hand Chain';
    this._hand.enabled = true;
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

      // forward-link the hand and then draw
      this._chain.link(this._hand, true);
      this._hand.draw();

      this.onTerminate.emit('end');
    }
  }

  protected __onBone(b: BoneModel): void
  {
    this._selectedBone        = b;
    this._selectedOrientation = b.orientation;
  }
}
